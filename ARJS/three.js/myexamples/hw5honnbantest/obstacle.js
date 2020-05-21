class Obstacle {
	constructor (center,size) {
		this.center = center.clone();  
		//this.mesh = new THREE.Mesh (new THREE.CylinderGeometry(size,size,1,20),
		//	new THREE.MeshBasicMaterial({color: 0xffbfbf})); // transparent: true, opacity: 0.9
		//this.mesh.position.copy (center);
		this.size = size;
        //this.color = THREE.Color(0xffffff);
      
        function onProgress(xhr) { console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ); }
        function onError(xhr) { console.log( 'An error happened' ); }

        new THREE.MTLLoader()
            .setPath( './pawn/' )
            .load( 'pawn.mtl', function ( materials ) {
                materials.preload();
                new THREE.OBJLoader()
                    .setMaterials( materials )
                    .setPath( './pawn/' )
                    .load( 'pawn.obj', function ( group ) {
                        //var theObject =  unitize (group, 20);
                        mesh0 = group.children[0];
                        mesh0.material.side = THREE.DoubleSide;
                        //mesh0.rotation.x= -Math.PI/2;
                        //mesh0.rotation.y= 1.5*Math.PI;
                        mesh0.position.y = 40;
                        mesh0.scale.set(10,10,10);
                        //markerRoot.add(mesh0);
                        this.mesh = mesh0;
                        this.mesh.position.copy (center);
                    }, onProgress, onError );
            });
    	scene.add (this.mesh);
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
