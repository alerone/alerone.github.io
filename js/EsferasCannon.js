/**
 * Esferas.js
 * Seminario   Animación por simulación física.
 * Esferas en habitación cerrada con molinete central
 * 
 * @author <rvivo@upv.es>, 2022
 */

import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import Stats from "../lib/stats.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import * as CANNON from '../lib/cannon-es.js'; 
//import * as CANNON from 'https://unpkg.com/cannon-es@0.19.0/dist/cannon-es.js'; 

// Globales convenidas por threejs
const renderer = new THREE.WebGLRenderer();
let camera;
const scene = new THREE.Scene();
// Control de camara
let cameraControls;
// Monitor de recursos
const reloj = new THREE.Clock();
const stats = new Stats();
// Mundo fisico
let world;
let disk;
const nesferas = 20;
const esferas = [];
const groundMaterial = new CANNON.Material("groundMaterial");
const materialEsfera = new CANNON.Material("sphereMaterial");

// Acciones
loadPhysicalWorld();
loadVisualWorld();
render();

/**
 * Construye una bola con cuerpo y vista
 */
function esfera( radio, posicion, material ){
	var masa = 1;
	this.body = new CANNON.Body( {mass: masa, material: material} );
	this.body.addShape( new CANNON.Sphere( radio ) );
	this.body.position.copy( posicion );
	this.visual = new THREE.Mesh( new THREE.SphereGeometry( radio ), 
		          new THREE.MeshBasicMaterial( {wireframe: true } ) );
	this.visual.position.copy( this.body.position );
}

/**
 * Carga el mundo fisico con un
 * suelo, cuatro paredes de altura infinita, un
 * disco que gira y el collar de esferas
 */
function loadPhysicalWorld()
{
	// Mundo 
  	world = new CANNON.World(); 
   	world.gravity.set(0,-9.8,0); 

	// Comprtamiento de materiales en contacto

    const sphereGroundContactMaterial = new CANNON.ContactMaterial(groundMaterial,materialEsfera,
    										    				{ friction: 0.7, 
    										      				  restitution: 0.7 });
    world.addContactMaterial(sphereGroundContactMaterial);

    // Suelo
    const groundShape = new CANNON.Plane();
    const ground = new CANNON.Body({ mass: 0, material: groundMaterial });
    ground.addShape(groundShape);
	ground.position.y = -0.25;
    ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(ground);

    // Paredes
    const backWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    backWall.addShape( new CANNON.Plane() );
    backWall.position.z = -5;
    world.addBody( backWall );

    const frontWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    frontWall.addShape( new CANNON.Plane() );
    frontWall.quaternion.setFromEuler(0,Math.PI,0,'XYZ');
    frontWall.position.z = 5;
    world.addBody( frontWall );

    const leftWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    leftWall.addShape( new CANNON.Plane() );
    leftWall.position.x = -5;
    leftWall.quaternion.setFromEuler(0,Math.PI/2,0,'XYZ');
    world.addBody( leftWall );

    const rightWall = new CANNON.Body( {mass:0, material:groundMaterial} );
    rightWall.addShape( new CANNON.Plane() );
    rightWall.position.x = 5;
    rightWall.quaternion.setFromEuler(0,-Math.PI/2,0,'XYZ');
    world.addBody( rightWall );

	// Collar de esferas
	for (var i = 0; i < nesferas; i++) {
		const e = new esfera( 1/2, new CANNON.Vec3( -1, i+1, 0 ), materialEsfera );
		world.addBody( e.body );
		scene.add( e.visual );
		esferas.push( e );
	};

    // Restricciones
 	for (var i = 0; i < esferas.length-1; i++) {
    	const restriccion = new CANNON.PointToPointConstraint(esferas[i].body,
    												    new CANNON.Vec3( 0, 1/2, 0),
    												    esferas[i+1].body,
														new CANNON.Vec3( 0, -1/2, 0) ); 
     	world.addConstraint( restriccion );
 	};   

	// Molinete
	// Es un disco fijo (masa=0) con velocidad angular que se representa como
	// un disco girando con tween
    const discShape = new CANNON.Cylinder(4,4,0.5,10); // ojo: eje en y
    disk = new CANNON.Body({ mass: 0, material: groundMaterial });
    disk.addShape(discShape);
    disk.angularVelocity.set(0,3,0); 
    world.addBody(disk);
}

/**
 * Carga la escena visual
 */
function loadVisualWorld()
{
	// Inicializar el motor de render
	
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000000) );
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	// Reloj
	reloj.start();

	// Crear y situar la camara
	const aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 75, aspectRatio , 0.1, 100 );
	camera.position.set( 2,5,10 );
	camera.lookAt( new THREE.Vector3( 0,0,0 ) );
	// Control de camara
	cameraControls = new OrbitControls( camera, renderer.domElement );
	cameraControls.target.set(0,0,0);

	// STATS --> stats.update() en update()
	
	stats.showPanel(0);	// FPS inicialmente. Picar para cambiar panel.
	document.getElementById( 'container' ).appendChild( stats.domElement );

	// Callbacks
	window.addEventListener('resize', updateAspectRatio );

	// Objetos
	const molinete = new THREE.Mesh( new THREE.CylinderGeometry(4,4,0.5,40), 				
									 new THREE.MeshBasicMaterial({color: 'black', wireframe: true}) ); 
	scene.add( molinete );
	molinete.add( new THREE.AxesHelper(1) );
	molinete.position.copy( disk.position );

	const giro = new TWEEN.Tween( molinete.rotation ).to( {x:0, y:2*Math.PI, z:0}, 3000 );
	giro.repeat(Infinity);
	giro.start();

	// Suelo
	const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10,1,1), new THREE.MeshNormalMaterial());
	suelo.rotation.x = -Math.PI/2;
	suelo.position.y = -0.25;
	scene.add( suelo);

	scene.add( new THREE.AxesHelper(5 ) );

}

/**
 * Isotropía frente a redimension del canvas
 */
function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

/**
 * Actualizacion segun pasa el tiempo
 */
function update()
{
	const segundos = reloj.getDelta();	// tiempo en segundos que ha pasado por si hace falte
	world.fixedStep()					// recalcula el mundo a periodo fijo (60Hz)

	for (var i = 0; i < esferas.length; i++) {
		esferas[i].visual.position.copy( esferas[i].body.position );
		esferas[i].visual.quaternion.copy( esferas[i].body.quaternion );
	};

	// Actualiza el monitor 
	stats.update();

	// Actualiza el movimeinto del molinete
	TWEEN.update();
}

/**
 * Update & render
 */
function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}