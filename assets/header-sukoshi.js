document.addEventListener("DOMContentLoaded", function(){

const btn = document.querySelector(".mobile-menu-btn")
const drawer = document.querySelector(".mobile-drawer")

if(btn){
btn.addEventListener("click", function(){
drawer.classList.toggle("active")
})
}

const menuItems = document.querySelectorAll(".menu-item");
const nav = document.querySelector(".sk-nav");

menuItems.forEach(item => {

item.addEventListener("mouseenter", () => {

menuItems.forEach(i => i.classList.remove("active"));

item.classList.add("active");

});

});

if(nav){
nav.addEventListener("mouseleave", () => {

menuItems.forEach(i => i.classList.remove("active"));

});
}

});



document.addEventListener("DOMContentLoaded", function(){

const rotators = document.querySelectorAll(".mega-product-rotator");

rotators.forEach(rotator => {

const products = rotator.querySelectorAll(".mega-product");

let index = 0;

function rotate(){

products.forEach(p => p.classList.remove("active"));

if(products[index]){
products[index].classList.add("active");
}

if(products[index+1]){
products[index+1].classList.add("active");
}

index += 2;

if(index >= products.length){
index = 0;
}

}

rotate();

setInterval(rotate,3000);

});

});








document.addEventListener("DOMContentLoaded", function(){

document.querySelectorAll(".mobile-parent").forEach(parent => {

parent.addEventListener("click", function(e){

const item = this.closest(".mobile-item");
const sub = item.querySelector(".mobile-sub");
const toggle = item.querySelector(".mobile-toggle");

if(!sub) return;

e.preventDefault();

const isOpen = sub.style.display === "block";

document.querySelectorAll(".mobile-sub").forEach(s => s.style.display = "none");
document.querySelectorAll(".mobile-toggle").forEach(t => t.textContent = "+");

if(!isOpen){
sub.style.display = "block";
if(toggle) toggle.textContent = "-";
}

});

});

});


document.addEventListener("click", function(e){

const drawer = document.querySelector(".mobile-drawer");
const btn = document.querySelector(".mobile-menu-btn");

if(!drawer.contains(e.target) && !btn.contains(e.target)){
drawer.classList.remove("active");
}

});