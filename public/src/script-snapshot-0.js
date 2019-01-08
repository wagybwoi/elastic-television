import { 
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Vector3,
    Euler,
    Group,
} from 'three';

let scene,
    renderer,
    camera,
    cube,
    cubeAnchor,
    posDamping = 0.9,
    rotDamping = 0.9,
    width = 5,
    height = 8,
    depth = 5;

let building = {
    object: undefined,
    position: undefined,
    rotation: undefined,
    targetTransform: {
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0)
    },
    acceleration: {
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0)
    },
    velocity: {
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0)
    },
    damping: {
        position: new Vector3(posDamping, posDamping, posDamping),
        rotation: new Euler(rotDamping, rotDamping, rotDamping)
    },
    moving: false
}

const init = () => {
    scene = new Scene();
    camera = new PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    renderer = new WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    const geometry = new BoxGeometry( width, height, depth );
    const material = new MeshBasicMaterial( { color: 0x00ff00 } );
    cube = new Mesh( geometry, material );
    scene.add( cube );

    camera.position.set(0, 0, 50);
    camera.rotation.set(0, 0, 0);
    
    // Connect cube to group to building obj
    cubeAnchor = new Group();
    scene.add(cubeAnchor);
    cubeAnchor.add(cube);
    // cube.position.y = height/2;
    building.object = cubeAnchor;
    building.position = cubeAnchor.position;
    building.rotation = cubeAnchor.rotation;
}

function setBuildingProps() {
    building.targetTransform.position.set(
        Math.floor(Math.random()*40-20),
        Math.floor(Math.random()*40-20),
        0
    );
    building.targetTransform.rotation.set(
        Math.floor(Math.random()*Math.PI-Math.PI/2),
        0,
        Math.floor(Math.random()*Math.PI-Math.PI/2)
    );
    building.moving = true;
}

const updateBuildingProps = () => {
    // debugger;
    if(building.moving) {
        // Snap position to target
        if(building.velocity.position.length < 0.001 || building.velocity.rotation.length < 0.001) {
            building.position.set(
                building.targetTransform.position.x,
                building.targetTransform.position.y,
                building.targetTransform.position.z
            );
            building.velocity.rotation.set(
                building.targetTransform.rotation.x,
                building.targetTransform.rotation.y,
                building.targetTransform.rotation.z
            );
            building.moving = false;
            return;
        }

        // Calculate acceleration
        building.acceleration.position.set(
            (building.targetTransform.position.x - building.position.x)*0.1,
            (building.targetTransform.position.y - building.position.y)*0.1,
            (building.targetTransform.position.z - building.position.z)*0.1
        );
        building.acceleration.rotation.set(
            (building.targetTransform.rotation.x - building.rotation.x)*0.1,
            (building.targetTransform.rotation.y - building.rotation.y)*0.1,
            (building.targetTransform.rotation.z - building.rotation.z)*0.1
        );

        // Calculate velocity
        building.velocity.position.set(
            (building.velocity.position.x + building.acceleration.position.x)*building.damping.position.x,
            (building.velocity.position.y + building.acceleration.position.y)*building.damping.position.y,
            (building.velocity.position.z + building.acceleration.position.z)*building.damping.position.z
        );
        building.velocity.rotation.set(
            (building.velocity.rotation.x + building.acceleration.rotation.x)*building.damping.rotation.x,
            (building.velocity.rotation.y + building.acceleration.rotation.y)*building.damping.rotation.y,
            (building.velocity.rotation.z + building.acceleration.rotation.z)*building.damping.rotation.z
        );

        // Calculate position
        building.position.set(
            building.position.x + building.velocity.position.x,
            building.position.y + building.velocity.position.y,
            building.position.z + building.velocity.position.z
        );
        building.rotation.set(
            building.rotation.x + building.velocity.rotation.x,
            building.rotation.y + building.velocity.rotation.y,
            building.rotation.z + building.velocity.rotation.z
        );
    }
}

const animate = function () {
    requestAnimationFrame( animate );

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    updateBuildingProps();

    renderer.render(scene, camera);
};

window.addEventListener('mousedown', () => {
    setBuildingProps();
});

window.addEventListener('resize', () => {
	if(camera && renderer) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
});

if( !init() ) animate();