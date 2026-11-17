"use strict";
// These sidebar entries remain visible but are not interactive.
for (const selector of [
  '[data-page="dashboard"]', '[data-page="corpus-search"]',
  '[data-page="textbooks"]',
  '[data-page="textbook-texts"]',
  '[data-page="listening-practices"]',
  '[data-book-type="词汇书籍"]'
]) {
  const button = document.querySelector('#sidebar .nav ' + selector);
  if (!button) continue;
  button.disabled = true;
  button.onclick = null;
  button.classList.add('nav-display-only');
}

// Group buttons only expand or collapse their submenu, without navigating.
for (const button of document.querySelectorAll('#sidebar .nav button[aria-controls]')) {
  const group = document.getElementById(button.getAttribute('aria-controls'));
  if (!group) continue;
  const expanded = ['question-bank-types','listening-nav-pages','book-types'].includes(group.id);
  group.hidden = !expanded;
  button.setAttribute('aria-expanded', String(expanded));
  button.onclick = () => {
    group.hidden = !group.hidden;
    button.setAttribute('aria-expanded', String(!group.hidden));
  };
}

// Keep each navigation group together when arranging the top-level entries.
const sidebarNav = document.querySelector('#sidebar .nav');
for (const selector of [
  '#vocabulary-nav-toggle', '#question-bank-toggle',
  '#textbook-nav-toggle', '[aria-controls="book-types"]', '#interactive-nav-toggle',
  '[data-page="corpus-search"]', '[data-page="dashboard"]', '#permissions-toggle'
]) {
  const button = sidebarNav.querySelector(selector);
  if (!button) continue;
  sidebarNav.append(button);
  const groupId = button.getAttribute('aria-controls');
  if (groupId) {
    const group = document.getElementById(groupId);
    if (group) sidebarNav.append(group);
  }
}

// Brand button toggles the optional sidebar sections without changing their state.
const sidebarBrandMark=document.querySelector('#sidebar .brandmark');
const sidebarBrandButton=document.createElement('button');
sidebarBrandButton.type='button';
sidebarBrandButton.className='sidebar-brand-toggle';
sidebarBrandButton.setAttribute('aria-label','显示全部功能');
sidebarBrandButton.setAttribute('aria-expanded','false');
sidebarBrandButton.innerHTML='<img src="assets/images/victor-company-logo.png" alt="维克多英语 Logo">';
sidebarBrandMark.replaceWith(sidebarBrandButton);
const sidebarOptionalSelectors=[
 '#textbook-nav-toggle', '#textbook-nav-pages',
 '[data-page="corpus-search"]', '[data-page="dashboard"]',
 '[data-page="vocabulary-standard"]', '[data-page="vocabulary-textbook"]',
 '[data-page="vocabulary-product"]', '[data-page="vocabulary-question-bank"]',
 '[data-page="listening-practices"]', '[data-book-type="词汇书籍"]',
 '[data-book-type="校本书籍"]',
 '[data-page="interactive-sentences"]', '[data-page="interactive-semantic-network"]'
];
// Resolve on each click so entries inserted by later scripts are included.
function getSidebarOptionalSections(){
 const sections=sidebarOptionalSelectors.map(selector=>document.querySelector('#sidebar '+selector)).filter(Boolean);
 sections.forEach((element,index)=>{if(!element.id)element.id='sidebar-optional-'+index});
 sidebarBrandButton.setAttribute('aria-controls',sections.map(element=>element.id).join(' '));
 return sections;
}
// This page-session flag also controls optional directory content and add choices.
// It deliberately does not persist: entering/reloading always starts simplified.
function optionalFeaturesExpanded(){
 return document.querySelector('.sidebar-brand-toggle')?.getAttribute('aria-expanded')==='true';
}
function applyOptionalFeatureVisibility(){
 const show=optionalFeaturesExpanded();
 getSidebarOptionalSections().forEach(element=>element.classList.toggle('brand-hidden',!show));
 sidebarBrandButton.setAttribute('aria-label',show?'收起扩展功能':'显示全部功能');
}
sidebarBrandButton.onclick=()=>{
 sidebarBrandButton.setAttribute('aria-expanded',String(!optionalFeaturesExpanded()));
 applyOptionalFeatureVisibility();
 render();
};
const optionalFeaturesRender=render;
render=function(){const result=optionalFeaturesRender();applyOptionalFeatureVisibility();return result};
applyOptionalFeatureVisibility();

// Initialize the landing page after book workflow helpers have loaded.
page='books';bookType='听力书籍';render();
