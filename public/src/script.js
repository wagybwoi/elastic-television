import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    DirectionalLight,
    BoxGeometry,
    PlaneGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    Vector3,
    Vector2,
    Euler,
    Group,
    Raycaster,
    Color,
    VideoTexture,
    LinearFilter,
    RGBFormat
} from 'three';

import {
    MTLLoader,
    OBJLoader
} from 'three-obj-mtl-loader';

let scene,
    renderer,
    directionalLight,
    camera,
    cube,
    cubeAnchor,
    posDamping = 0.95,
    rotDamping = 0.95,
    raycaster = new Raycaster(),
    mouse = new Vector2(),
    vidTex,
    television;

let building = {
    object: undefined,
    position: undefined,
    rotation: undefined,
    dimensions: {
        x: 20,
        y: 30,
        z: 20
    },
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
    moving: false,
    dragging: false
}

const init = () => {
    scene = new Scene();
    scene.background = new Color( 0xffffff );
    camera = new PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

    renderer = new WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);

    const geometry = new BoxGeometry( building.dimensions.x, building.dimensions.y, building.dimensions.z );
    const material = new MeshStandardMaterial( { color: 0x080808, roughness: 1.0, metalness: 0.0 } );
    // cube = new Mesh( geometry, material );
    // cube.rotation.y = -Math.PI/6;
    // scene.add( cube );

    directionalLight = new DirectionalLight( 0xffffff, 1.0 );
    directionalLight.position.set(50, 50, 50);
    // directionalLight.target = cube;
    scene.add( directionalLight );

    camera.position.set(0, 0, 3);
    // camera.rotation.set((Math.PI/180)*25, 0, 0);
    
    // Connect cube to group to building obj
    cubeAnchor = new Group();
    scene.add(cubeAnchor);
    building.object = cubeAnchor;
    building.position = cubeAnchor.position;
    building.rotation = cubeAnchor.rotation;

    loadTV();
}

const loadTV = () => {
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    mtlLoader.load('./model/tv.mtl', (materials) => {
        materials.preload();
        objLoader.setMaterials(materials);
        objLoader.load('./model/tv.obj', (tv) => {
            television = tv;
            tv.rotation.y = Math.PI - Math.PI/8;
            cubeAnchor.add(tv);

            const tvScreen_geo = new PlaneGeometry( 0.9, 0.7 );

            const video = document.getElementById( 'video' );
            let vidTex = new VideoTexture( video );
            vidTex.minFilter = LinearFilter;
            vidTex.magFilter = LinearFilter;
            vidTex.format = RGBFormat;
            const tvScreen_mat = new MeshBasicMaterial( { map: vidTex } );

            const tvScreen = new Mesh( tvScreen_geo, tvScreen_mat );
            tv.add( tvScreen );
            tvScreen.position.set(0.1, 0, -0.38);
            tvScreen.rotation.set(0, Math.PI, 0);
            
            console.log(tv);
        });
    });
}

function setBuildingProps(x, y) {
    building.position.set(
        -x*2,
        -y*2,
        0
    );

    building.targetTransform.position.set(
        0,
        0,
        0
    );
    
    building.rotation.set(
        0,
        0,
        x
    );

    building.targetTransform.rotation.set(
        0,
        0,
        0
    );
}

const updateBuildingProps = () => {
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

        const accelerationDamper = 0.03;
        // Calculate acceleration
        building.acceleration.position.set(
            (building.targetTransform.position.x - building.position.x)*accelerationDamper,
            (building.targetTransform.position.y - building.position.y)*accelerationDamper,
            (building.targetTransform.position.z - building.position.z)*accelerationDamper
        );
        building.acceleration.rotation.set(
            (building.targetTransform.rotation.x - building.rotation.x)*accelerationDamper,
            (building.targetTransform.rotation.y - building.rotation.y)*accelerationDamper,
            (building.targetTransform.rotation.z - building.rotation.z)*accelerationDamper
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

    updateBuildingProps();
    updateHovers();

    if(vidTex) vidTex.needsUpdate = true;
    renderer.render(scene, camera);
};

const updateHovers = () => {
    
}

window.addEventListener('mousemove', event => {
	raycaster.setFromCamera( {
        x: ( event.clientX / window.innerWidth ) * 2 - 1,
        y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }, camera);
	let intersects = raycaster.intersectObjects(television.children);

    // HAVE THIS UPDATING ALL THE TIME
    document.getElementById("container").style.cursor = (intersects.length && "grab") || "auto";
    
    if(building.dragging) {
        mouse.x = (event.clientX/window.innerWidth)*2-1;
        mouse.y = -(event.clientY/window.innerHeight)*2+1;
        setBuildingProps( (-Math.PI/2)*mouse.x, (-Math.PI/2)*mouse.y );
    }
});

window.addEventListener('mousedown', () => {
    building.moving = false;
    building.dragging = true;
});

window.addEventListener('mouseup', () => {
    building.moving = true;
    building.dragging = false;
});

window.addEventListener('resize', () => {
	if(camera && renderer) {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
});

if( !init() ) animate();