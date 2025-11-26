// Grocery App — features: LocalStorage, Dark mode, Categories, Export/Import JSON
const STORE_KEY = 'grocery-items-enhanced-v1'
let items = JSON.parse(localStorage.getItem(STORE_KEY) || '[]')

// DOM
const tpl = document.getElementById('itemTpl')
const listEl = document.getElementById('groceryList')
const addBtn = document.getElementById('addBtn') || document.getElementById('addBtn')
const itemInput = document.getElementById('itemInput')
const categorySelect = document.getElementById('categorySelect')
const itemQty = document.getElementById('itemQty')
const searchInput = document.getElementById('searchInput')
const filterCategory = document.getElementById('filterCategory')
const sortSelect = document.getElementById('sortSelect')
const themeToggle = document.getElementById('themeToggle')

const selectAllBtn = document.getElementById('selectAll')
const deleteSelectedBtn = document.getElementById('deleteSelected')
const clearPurchasedBtn = document.getElementById('clearPurchased')
const exportBtn = document.getElementById('exportBtn')
const importBtn = document.getElementById('importBtn')
const importFile = document.getElementById('importFile')

let selection = new Set()

function save(){
  localStorage.setItem(STORE_KEY, JSON.stringify(items))
}

function render(filtered=null){
  listEl.innerHTML = ''
  const source = filtered || applySortAndFilter(items)
  source.forEach((it)=>{
    const node = tpl.content.cloneNode(true)
    const li = node.querySelector('li')
    const selectChk = node.querySelector('.select-chk')
    const completeChk = node.querySelector('.complete-chk')
    const text = node.querySelector('.text')
    const cat = node.querySelector('.cat')
    const qty = node.querySelector('.qty')
    const editBtn = node.querySelector('.edit')
    const delBtn = node.querySelector('.del')

    text.textContent = it.text
    cat.textContent = '('+it.category+')'
    qty.textContent = 'Qty: '+(it.qty || 1)
    if(it.completed) li.classList.add('completed')
    selectChk.checked = selection.has(it.id)
    completeChk.checked = !!it.completed

    selectChk.addEventListener('change', ()=>{
      if(selectChk.checked) selection.add(it.id)
      else selection.delete(it.id)
    })
    completeChk.addEventListener('change', ()=>{
      const idx = items.findIndex(x=> x.id === it.id)
      if(idx>-1){ items[idx].completed = completeChk.checked; save(); render() }
    })
    editBtn.addEventListener('click', ()=>{
      const newTxt = prompt('Edit item', it.text)
      if(newTxt && newTxt.trim()){
        const idx = items.findIndex(x=> x.id === it.id)
        items[idx].text = newTxt.trim(); save(); render()
      }
    })
    delBtn.addEventListener('click', ()=>{
      items = items.filter(x=> x.id !== it.id); save(); render()
    })

    listEl.appendChild(node)
    requestAnimationFrame(()=> li.classList.add('item-enter'))
    setTimeout(()=> li.classList.remove('item-enter'), 180)
  })
}

function addItem(){
  const txt = itemInput.value && itemInput.value.trim()
  if(!txt) return
  const cat = categorySelect.value || 'Other'
  const qty = Number(itemQty.value) || 1
  const obj = { id: Date.now().toString(), text: txt, category: cat, qty: qty, completed: false, created: Date.now() }
  items.unshift(obj)
  save(); render(); itemInput.value=''; itemQty.value=1
}
document.getElementById('addBtn').addEventListener('click', addItem)
itemInput.addEventListener('keydown', e=> e.key==='Enter' && addItem())

function applySortAndFilter(arr){
  let res = arr.slice()
  const cat = filterCategory.value
  if(cat) res = res.filter(i=> i.category === cat)
  const q = searchInput.value.trim().toLowerCase()
  if(q) res = res.filter(i=> i.text.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
  const s = sortSelect.value
  if(s === 'alpha') res.sort((a,b)=> a.text.localeCompare(b.text))
  else if(s === 'category') res.sort((a,b)=> a.category.localeCompare(b.category))
  else res.sort((a,b)=> b.created - a.created)
  return res
}

searchInput.addEventListener('input', ()=> render())
filterCategory.addEventListener('change', ()=> render())
sortSelect.addEventListener('change', ()=> render())

// Bulk actions
selectAllBtn.addEventListener('click', ()=>{
  const visible = applySortAndFilter(items)
  const allSelected = visible.every(v=> selection.has(v.id))
  if(allSelected) selection.clear()
  else visible.forEach(v=> selection.add(v.id))
  render()
})
deleteSelectedBtn.addEventListener('click', ()=>{
  if(selection.size===0) return
  items = items.filter(i=> !selection.has(i.id))
  selection.clear(); save(); render()
})
clearPurchasedBtn.addEventListener('click', ()=>{
  items = items.filter(i=> !i.completed); save(); render()
})

// Export / Import
exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'grocery-items.json'; a.click()
  URL.revokeObjectURL(url)
})
importBtn.addEventListener('click', ()=> importFile.click())
importFile.addEventListener('change', (e)=>{
  const f = e.target.files[0]; if(!f) return
  const reader = new FileReader()
  reader.onload = ()=> {
    try{
      const data = JSON.parse(reader.result)
      if(Array.isArray(data)){
        items = data.map(d=> ({ id: d.id || Date.now().toString()+Math.random(), text: d.text||'Untitled', category: d.category||'Other', qty: d.qty||1, completed: !!d.completed, created: d.created||Date.now() }))
        save(); render()
      } else alert('Invalid JSON format (expected array)')
    }catch(err){ alert('Failed to parse JSON') }
  }
  reader.readAsText(f)
})

// Theme toggle
const savedTheme = localStorage.getItem('theme') || 'light'
if(savedTheme === 'dark') document.documentElement.setAttribute('data-theme','dark')
themeToggle.addEventListener('click', ()=>{
  const now = document.documentElement.getAttribute('data-theme') === 'dark' ? '' : 'dark'
  document.documentElement.setAttribute('data-theme', now)
  localStorage.setItem('theme', now === 'dark' ? 'dark' : 'light')
})

// initial render
render()
