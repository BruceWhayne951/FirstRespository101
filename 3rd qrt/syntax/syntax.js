document.getElementById('numberExample').innerText = 12345;
document.getElementById('deci').innerText = 12.345;

document.getElementById('doubleQ').innerText = "This is a double quote example.";
document.getElementById('singleQ').innerText = 'This is a single quote example.';

let greeting = "Hello, world! Welcome to JavaScript syntax.";
 const pi = 3.14159;
 var isJavaScriptFun = true;

document.getElementById('vlet').innerText = greeting;
document.getElementById('vconst').innerText = pi;
document.getElementById('vvar').innerText = isJavaScriptFun;

let aa = 10;
let bb = 20;
var cc = 30;

document.getElementById('a').innerText = aa;
document.getElementById('b').innerText = bb;
document.getElementById('c').innerText = cc;

function changeValues() {
  aa = 100;
  bb = 200;
  cc = 300;
  document.getElementById('a').innerText = aa;
  document.getElementById('b').innerText = bb;
  document.getElementById('c').innerText = cc; 
}