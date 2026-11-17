import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Button,ConfigProvider,Dropdown,Select,AutoComplete,Segmented} from 'antd';
import {PlusOutlined,CloseOutlined,HolderOutlined} from '@ant-design/icons';
import Sortable from 'sortablejs';
const roots=[],sortables=[];
const theme={token:{colorPrimary:'#2463ed',fontSize:13,borderRadius:6,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif'}};
function MenuButton({items,onSelect,label,number,frequency,grouped,mode,onModeChange,menuClass=''}){
 const [open,setOpen]=React.useState(false);
 const menuItems=grouped?items.map(group=>({...group,children:group.children?.map(item=>({...item,icon:<PlusOutlined/>}))})):items;
 if(!items.length)return null;
 return <Dropdown dropdownRender={mode===undefined?undefined:menu=><div className="meaning-menu-panel"><div className="meaning-mode-toggle"><Segmented block aria-label="释义模式" value={mode} options={[{label:'中文释义',value:'meaning'},{label:'释义词块',value:'chunk'}]} onChange={value=>{setOpen(false);queueMicrotask(()=>onModeChange(value))}}/></div>{menu}</div>} trigger={['click']} open={open} onOpenChange={setOpen} menu={{items:menuItems,selectable:number!==undefined,selectedKeys:number!==undefined?[frequency]:[],onClick:({key})=>{setOpen(false);queueMicrotask(()=>onSelect(key))}}} overlayClassName={`present-options-menu${grouped?' grouped-options-menu':''} ${menuClass}`} placement="bottomLeft">
 <Button className={number!==undefined?`frequency-number ${frequency==='高'?'high':frequency==='低'?'low':'unset'}`:'unified-add'} aria-label={label} aria-expanded={open} icon={number!==undefined?undefined:<PlusOutlined/>}>{number}</Button>
 </Dropdown>;
}
function InlineSelect({label,value,options,onChange,onCancel}){
 return <Select autoFocus defaultOpen popupMatchSelectWidth={false} virtual={false} dropdownStyle={{minWidth:220,maxWidth:"calc(100vw - 32px)"}} style={{width:Math.min(320,Math.max(120,...options.map(o=>String(o.label).length*13+48)))}} defaultValue={value} options={options.map(o=>({...o,title:''}))} aria-label={label} popupClassName="present-select-menu" onChange={v=>queueMicrotask(()=>onChange(v))} onBlur={()=>queueMicrotask(onCancel)} onInputKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();queueMicrotask(onCancel)}}}/>;
}
function InlineAutocomplete({label,value,placeholder,options,onInput,onCommit,onCancel}){
 return <AutoComplete autoFocus defaultOpen popupMatchSelectWidth={false} virtual={false} dropdownStyle={{minWidth:240,maxWidth:"calc(100vw - 32px)"}} placeholder={placeholder} defaultValue={value} aria-label={label} options={options.map(value=>({value,title:''}))} popupClassName="present-select-menu" filterOption={(input,option)=>option.value.includes(input)} onChange={onInput} onSelect={()=>queueMicrotask(onCommit)} onBlur={()=>queueMicrotask(onCommit)} onInputKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();queueMicrotask(onCancel)}else if(e.key==='Enter'){e.preventDefault();queueMicrotask(onCommit)}}}/>;
}
window.PresentUI={
 autocomplete(host,props){const root=createRoot(host);flushSync(()=>root.render(<ConfigProvider theme={theme}><InlineAutocomplete {...props}/></ConfigProvider>));return ()=>flushSync(()=>root.unmount())},
 select(host,props){const root=createRoot(host);flushSync(()=>root.render(<ConfigProvider theme={theme}><InlineSelect {...props}/></ConfigProvider>));return ()=>flushSync(()=>root.unmount())},
 dispose(){for(const sortable of sortables)sortable.destroy();sortables.length=0;for(const root of roots)flushSync(()=>root.unmount());roots.length=0},
 mount(host,kind,props){const root=createRoot(host);roots.push(root);let child;
 if(kind==='menu')child=<MenuButton {...props}/>;
 if(kind==='remove')child=<Button type="text" size="small" className="remove-module" icon={props.trash?<img className="shared-delete-icon" src="../../assets/directory-icons/directory-trash.svg" alt=""/>:<CloseOutlined/>} aria-label={props.label} onClick={e=>{e.stopPropagation();queueMicrotask(props.onClick)}}/>;
 if(kind==='drag')child=<Button type="text" size="small" className="meaning-drag-handle" icon={<HolderOutlined/>} aria-label={props.label} data-drag-meaning={props.index}/>;
 if(kind==='add')child=<Button className="unified-add" icon={<PlusOutlined/>} aria-label={props.label} onClick={()=>queueMicrotask(props.onClick)}>{props.text}</Button>;
 flushSync(()=>root.render(<ConfigProvider theme={theme}>{child}</ConfigProvider>));
 },
 sortable(host,onEnd,options={}){sortables.push(new Sortable(host,{animation:160,handle:'.meaning-drag-handle',draggable:'.sense-section',ghostClass:'sort-ghost',chosenClass:'sort-chosen',...options,onEnd:event=>{if(event.oldDraggableIndex!==event.newDraggableIndex)onEnd(event.oldDraggableIndex,event.newDraggableIndex)}}))}
};
