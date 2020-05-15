/* eslint-disable no-unused-vars */
function addEvent(el, type, handler) {
  if(el.attachEvent){el.attachEvent('on'+type, handler);}else{el.addEventListener(type, handler);}
}

// live binding helper using matchesSelector
function live(selector, event, callback, context) {
  addEvent(context || document, event, (e) => {
    var found; var el = e.target || e.srcElement;
    while (el && el.matches && el !== context && !(found = el.matches(selector))){el = el.parentElement;}
    if(found){callback.call(el, e);}
  });
}

function hasClass(el, className) {
  return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
}

function addClass(el, className) {
  if (el.classList){ el.classList.add(className);}
  else if (!hasClass(el, className)){ el.className += ' ' + className;}
}

function removeClass(el, className) {
  if (el.classList){ el.classList.remove(className);}
  else {el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');}
}

function insertAfter(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

function insertBefore(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode);
}

document.addEventListener('DOMContentLoaded', () => {

  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach( el => {
      el.addEventListener('click', () => {

        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }

});

function setCheckedValue(radioObj, newValue) {
  if(!radioObj){ return; }
  var radioLength = radioObj.length;
  if(radioLength === undefined) {
	  radioObj.checked = (radioObj.value === newValue.toString());
    return;
  }
  for(var i = 0; i < radioLength; i++) {
    radioObj[i].checked = false;
    if(radioObj[i].value === newValue.toString()) {
      radioObj[i].checked = true;
    }
  }
}

function validateForm(form){
  let validate = true;
  const elements = form.elements;
  for (let i = 0; i < elements.length; i++) {
    if(elements[i].hasAttribute('required') && (elements[i].value==='' || elements[i].value===undefined || elements[i].value===null )){
      addClass(elements[i].parentNode,'is-danger');
      addClass(elements[i],'is-danger');
      let msg = elements[i].parentNode.querySelector('p');
      if(!msg){
        let m = document.createElement('p');
        addClass(m,'help');
        addClass(m,'is-danger');
        m.innerHTML='Campo requerido';
        elements[i].parentNode.appendChild(m);
      }
      validate = false;
    }else{
      removeClass(elements[i].parentNode,'is-danger');
      removeClass(elements[i],'is-danger');
      addClass(elements[i].parentNode,'is-success');
      addClass(elements[i],'is-success');
      let m = elements[i].parentNode.querySelector('.help');
      if(m){m.remove();}
    }
  }
  return validate;
}

function validateCategories(group){
  let validate = false;
  for (let i = 0; i < group.length; i++) {
    if(group[i].checked){validate=true;}
  }
  return validate;
}

function CategoriesJSON(group){
  let json = [];
  for (let i = 0; i < group.length; i++) {
    if(group[i].checked){json.push(group[i].value);}
  }
  return JSON.stringify(json);
}

function asyncImageLoader(url){
  return new Promise( (resolve, reject) => {
    var image = new Image();
    image.src = url;
    image.onload = () => {
      image.src = url;
      resolve(image);
    };
    image.onerror = () => {
      setTimeout(() => {},3000);
      image.src = url;
    };
  });
}

function decodeHTMLEntities (str) {
  if(str && typeof str === 'string') {
    // strip script/html tags
    str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
    str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
  }

  return str;
}

function getCORS(url, success) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = success;
  xhr.send();
  return xhr;
}

function monthName(m, format){
  let name = [];
  switch(m){
    case 0:
      name['short'] = 'Ene';
      name['long'] = 'Enero';
      break;
    case 1:
      name['short'] = 'Feb';
      name['long'] = 'Febrero';
      break;
    case 2:
      name['short'] = 'Mar';
      name['long'] = 'Marzo';
      break;
    case 3:
      name['short'] = 'Abr';
      name['long'] = 'Abril';
      break;
    case 4:
      name['short'] = 'May';
      name['long'] = 'Mayo';
      break;
    case 5:
      name['short'] = 'Jun';
      name['long'] = 'Junio';
      break;
    case 6:
      name['short'] = 'Jul';
      name['long'] = 'Julio';
      break;
    case 7:
      name['short'] = 'Ago';
      name['long'] = 'Agosto';
      break;
    case 8:
      name['short'] = 'Sep';
      name['long'] = 'Septiembre';
      break;
    case 9:
      name['short'] = 'Oct';
      name['long'] = 'Octubre';
      break;
    case 10:
      name['short'] = 'Nov';
      name['long'] = 'Noviembre';
      break;
    case 11:
      name['short'] = 'Dic';
      name['long'] = 'Diciembre';
      break;
  }
  return name[format];
}