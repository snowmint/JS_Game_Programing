class Target {
	constructor (id, pos) {
		this.id = id;
		this.pos = pos.clone();
		this.mesh = new THREE.Mesh (new THREE.CylinderGeometry (8,8,3,20), 
		    new THREE.MeshBasicMaterial ({color:0xffe099, transparent: true, opacity: 0.9}));
		this.found = false;  // default: not found yet
		this.mesh.position.copy (pos)
		markerRoot.add (this.mesh);
	}
	setFound (agent) {
		this.found = true;
		this.mesh.material.visible = false;
		postMessage (agent, 'TARGET reached');
		
		agent.score += 10;			
		
		// remove from scene.targets
		for (let i = 0; i < markerRoot.targets.length; i++) {
			if (markerRoot.targets[i].id === this.id) markerRoot.targets.splice (i, 1)
		}
		
	}
	
}