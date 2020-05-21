class Obstacle {
    constructor (center,size) {
        this.center = center.clone();
        //this.mesh = new THREE.Mesh();
        
        //this.mesh = new THREE.Mesh (new THREE.CylinderGeometry(size,size,1,20),new THREE.MeshBasicMaterial({color: 0xffbfbf})); // transparent: true, opacity: 0.9
        //this.mesh.position.copy (center);
        this.size = size;
        //this.color = THREE.Color(0xffffff);

         // model
        var onProgress = function(xhr) {
            if (xhr.lengthComputable) {
              var percentComplete = xhr.loaded / xhr.total * 100;
              console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };
        var onError = function(xhr) {};
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('queenchess/');
        mtlLoader.load('queenchess.mtl', function(materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('queenchess/');
            objLoader.load('queenchess.obj', function(object) {
                //let theObject =  unitize (object, size);
                //theObjectAll = unitize (object, 20);
                //let yellow_box = new THREE.BoxHelper (theObjectAll);
                //add light
                var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );//0.4
                scene.add( ambientLight );

                //var pointLight = new THREE.PointLight( 0xffffff, 0.3 );//0.8
                //camera.add( pointLight );

                var light = new THREE.DirectionalLight(0xffffff);//光源顏色
                light.position.set(20, 10, 1000);//光源位置
                scene.add(light);//光源新增到場景中
                //end add light
                scene.add (object);
                //scene.add (theObjectAll);
                //scene.add (yellow_box);
                //////// MATERIAL ADJUSTMENT for porsche ///////////////
                // transparent window: double-side fix
                object.traverse (
                    function(mesh) {
                        if (mesh instanceof THREE.Mesh) {
                            mesh.material.side = THREE.DoubleSide;
                            mesh.scale.set( 1000, 1000, 1000 );
                            mesh.position.copy (center);
                            //mesh.rotation.y -= Math.PI/6;
                            mesh.rotation.z -= Math.PI/18;
                            mesh.rotation.x -= Math.PI/9;
                            //mesh.position.copy (center);
                            mesh.position.y = 95;
                        }
                    }
                );
            }, onProgress, onError);
        });
        //scene.add (this.mesh);
    }
	
	checkCollision (agent) {
		const HIT_CRITERIA = 0.8;
		// when the agent is inside 80% of the circle
		// then consider it HIT 
		if (this.center.distanceTo (agent.pos) < this.size*HIT_CRITERIA) {
			postMessage (agent, 'HIT obstacle');
			agent.score -= 0.1;
		}
	}
    
    avoidCollision (agent) {
		const HIT_CRITERIA = 1.5;
		// when the agent is inside 80% of the circle
		// then consider it HIT 
		if (this.center.distanceTo (agent.pos) < this.size*HIT_CRITERIA){
			return true;
		}
        else return false;
	}
}
