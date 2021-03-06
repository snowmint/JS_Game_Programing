function agentMesh(size, colorName = 'red') {
  // mesh facing +x
  //	let geometry = new THREE.Geometry();
  //	  geometry.vertices.push (new THREE.Vector3(3*size,0,0))
  //	  geometry.vertices.push (new THREE.Vector3(0,0,-size))
  //	  geometry.vertices.push (new THREE.Vector3(0,0,size))
  //	  geometry.vertices.push (new THREE.Vector3(0,size,0))
  //  
  //	  geometry.faces.push(new THREE.Face3(0, 3, 2));
  //	  geometry.faces.push(new THREE.Face3(0, 2, 1));
  //	  geometry.faces.push(new THREE.Face3(1, 3, 0));
  //	  geometry.faces.push(new THREE.Face3(1, 2, 3));
  //	  geometry.computeFaceNormals()
  let geometry = new THREE.BufferGeometry();
  const points = [
    new THREE.Vector3(0, 0, size), //c
    new THREE.Vector3(0, 0, -size), //b
    new THREE.Vector3(3 * size, 0, 0), //a   

    new THREE.Vector3(3 * size, 0, 0), //a    
    new THREE.Vector3(0, size, 0), //d  
    new THREE.Vector3(0, 0, size), //c

    new THREE.Vector3(0, 0, -size), //b
    new THREE.Vector3(0, size, 0), //d  
    new THREE.Vector3(3 * size, 0, 0), //a

    new THREE.Vector3(0, 0, size), //c
    new THREE.Vector3(0, size, 0), //d    
    new THREE.Vector3(0, 0, -size), //b
  ]

  geometry.setFromPoints(points);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry,
    new THREE.MeshBasicMaterial({
      color: colorName,
      transparent: true,
      opacity: 0.9
    })) //, wireframe:true
}

class Agent {
  constructor(name, pos, halfSize, color) {
    this.name = name; //"BlueArrow";
    this.pos = pos.clone();
    this.vel = new THREE.Vector3();
    this.force = new THREE.Vector3();
    this.target = null;
    this.halfSize = halfSize; // half width
    this.mesh = agentMesh(this.halfSize, color); //0xaad4ff
    /*var obj_origami;// = new THREE.Mesh();
    
    var onProgress = function(xhr) {
    if (xhr.lengthComputable) {
          var percentComplete = xhr.loaded / xhr.total * 100;
          console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };
    var onError = function(xhr) {};
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('origami/');
    mtlLoader.load('origami.mtl', function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('origami/');
        objLoader.load('origami.obj', function(object) {
            let yellow_box = new THREE.BoxHelper (object);
            scene.add(yellow_box);
            scene.add(object);
            obj_origami = object;
            object.traverse (
                function(mesh) {
                    if (mesh instanceof THREE.Mesh) {
                        mesh.material.side = THREE.DoubleSide;
                        mesh.material.color.setHex( 0x000000 );//color
                        mesh.scale.set( 100, 100, 100 );
                        mesh.position.x = pos[0];
                        mesh.position.y = 0;
                        mesh.position.z = pos[2];
                    }
                }
            );
        }, onProgress, onError);
    });
    //console.log(obj_origami);
    this.mesh = obj_origami;
    //this.mesh.scale.set( 100, 100, 100 );
    //this.mesh.material.color.setHex( 0x000000 );//color
    //this.mesh.position = pos.clone();
    console.log(this.mesh);*/

    this.MAXSPEED = 400; //300
    this.ARRIVAL_R = 30; //30
    this.size = 5;
    this.score = 0.00;

    // for orientable agent
    this.angle = 0;
    markerRoot.add(this.mesh);
  }

  update(dt) {

    // about target ...
    if (this.target === null || this.target.found === true) { // no more target OR target found by other agent
      console.log('find target')
      this.findTarget();
      return; // wait for next turn ...
    }

    this.accumulateForce();

    // collision
    let min = Infinity,
      whichOne;
    let obs = markerRoot.obstacles;

    for (let i = 0; i < obs.length; i++) {
      let distance = Math.sqrt(((this.pos.x) - (obs[i].center.x)) * ((this.pos.x) - (obs[i].center.x)) + ((this.pos.z) - (obs[i].center.z)) * ((this.pos.z) - (obs[i].center.z)))
      if (min >= distance) {
        min = distance;
        whichOne = i;
      }
    }
    this.size = obs[whichOne].size - 10;
    //console.log(obs[whichOne].center)
    let vhat = this.vel.clone().normalize();
    let point = obs[whichOne].center.clone().sub(this.pos) // c-p
    let proj = point.dot(vhat);
    const REACH = 70; //80
    const K = 75; //85
    if (proj > 0 && proj < REACH) {
      let perp = new THREE.Vector3();
      perp.subVectors(point, vhat.clone().setLength(proj));
      let overlap = obs[whichOne].size + this.size - perp.length();
      //console.log(perp);
      if (overlap > 0) {
        perp.setLength(K * overlap);
        perp.negate()
        this.force.add(perp);
        //console.log ("hit:", perp);
      }
    }
    // for all obstacles in the scene
    // pick the most threatening one
    // apply the repulsive force
    // (write your code here)

    // Euler's method      
    this.vel.add(this.force.clone().multiplyScalar(dt).multiplyScalar(2));


    // velocity modulation
    let diff = this.target.pos.clone().sub(this.pos)
    let dst = diff.length();
    if (dst < this.ARRIVAL_R) {
      this.vel.setLength(dst)
      const REACH_TARGET = 25; //ori : 5
      if (dst < REACH_TARGET) { // target reached
        console.log(this.name + ' : target reached');
        this.target.setFound(this);
        this.target = null;
      }
    }

    // Euler
    this.pos.add(this.vel.clone().multiplyScalar(dt));
    this.mesh.position.copy(this.pos);

    // for orientable agent
    // non PD version
    //console.log(this.vel);
    if (this.vel.length() > 0.1) {
      this.angle = Math.atan2(-this.vel.z, this.vel.x)
      this.mesh.rotation.y = this.angle
    }
  }

  findTarget() {
    console.log('total: ' + markerRoot.targets.length)
    let allTargets = markerRoot.targets;
    let minD = 1e10;
    let d;
    for (let i = 0; i < allTargets.length; i++) {
      d = this.pos.distanceTo(allTargets[i].pos)
      if (d < minD) {
        minD = d;
        this.setTarget(allTargets[i])
      }
    }
  }
  findObstacle() {
    console.log('obstacle:' + markerRoot.obstacles.length)
    let allObstacle = markerRoot.obstacles;
    let minD = 1e10;
    let d;
    for (let i = 0; i < allObstacle.length; i++) {
      d = this.pos.distanceTo(allObstacle[i].pos)
      if (d < minD) {
        minD = d;
        this.setTarget(allTargets[i])
      }
    }
  }
  setTarget(target) {
    this.target = target;
  }
  targetInducedForce(targetPos) {
    return targetPos.clone().sub(this.pos).normalize().multiplyScalar(this.MAXSPEED).sub(this.vel)
  }

  accumulateForce() {
    // seek
    this.force.copy(this.targetInducedForce(this.target.pos));
  }

}
