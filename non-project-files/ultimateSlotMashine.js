
/* Licence MIT :
 *  Nikola Lukic free project
 *  Resources used from : (slot 3d object from)
 *  http://www.3dcadbrowser.com/download.aspx?3dmodel=10703
 */

var position_ = {
    z: 70,
    y: 230,
    x: -120
};
text1 = new TEXT3D(position_);
text1.size = 22;
text1.onload = function () {

    text1.SET_TEXT("ultimate slot")

};
loadFont(text1);

var position_ = {
    z: -1170,
    y: 230,
    x: -520
};
text2 = new TEXT3D(position_, true);
text2.size = 22;
text2.onload = function () {

    text2.SET_TEXT("enable webcam")

};
loadFont(text2);

var position_ = {
    z: -1170,
    y: -330,
    x: -820
};
text3 = new TEXT3D(position_, true);
text3.size = 18;
text3.onload = function () {

    //https://www.youtube.com/watch?v=mfwN0X8YnWo
    text3.SET_TEXT("I do not own this video , it is just for example . Video spot : Animals - Don't let me be Misunderstood ")

};
loadFont(text3);

var position_ = {
    z: -1170,
    y: 100,
    x: -520
};
text4 = new TEXT3D(position_, true);
text4.size = 22;
text4.onload = function () {

    text4.SET_TEXT("voice command : spin ")

};
loadFont(text4);

//STATIC AND DINAMIC
var SAVE_MATERIALS_FROM_STARTUP = {};

var INSTANCE_SLOT = new IMPORT.OBJ('ULTIMATE_MASHINE', 'res/ultimateSlot/slot1.obj')

    INSTANCE_SLOT.LOADED_OBJECT = function () {
    ULTIMATE_MASHINE.scale.set(99, 99, 99)
    ULTIMATE_MASHINE.position.setY(-300)

    //ULTIMATE_MASHINE.children[3].material = RM.COOL.Chrome1;

    SYS.DOM.createElement('video', 'res/ultimateSlot/Animals.mp4', 'animals', true);

    ULTIMATE_MASHINE.children[3].material = RM.COOL.Chrome2;
    ULTIMATE_MASHINE.children[2].material = RM.COOL.Chrome1;

    SAVE_MATERIALS_FROM_STARTUP.R1 = REEL.children[0].material;
    SAVE_MATERIALS_FROM_STARTUP.R2 = REEL2.children[0].material;
    SAVE_MATERIALS_FROM_STARTUP.R3 = REEL3.children[0].material;
    SAVE_MATERIALS_FROM_STARTUP.R4 = REEL4.children[0].material;
    SAVE_MATERIALS_FROM_STARTUP.R5 = REEL5.children[0].material;

    setTimeout(function () {
        ANIMALS_MATERIAL = new VIDEO_TEXTURE('animals');
        REEL.children[0].material = ANIMALS_MATERIAL.movieMaterial;
        REEL2.children[0].material = ANIMALS_MATERIAL.movieMaterial;
        REEL3.children[0].material = ANIMALS_MATERIAL.movieMaterial;
        REEL4.children[0].material = ANIMALS_MATERIAL.movieMaterial;
        REEL5.children[0].material = ANIMALS_MATERIAL.movieMaterial;

        ULTIMATE_MASHINE.children[4].material = ANIMALS_MATERIAL.movieMaterial;

        scene.remove(ANIMALS_MATERIAL.movieScreen)

    }, 200)

};

var INSTANCE_REEL1 = new IMPORT.OBJ('REEL', 'res/ultimateSlot/reel.obj', 'res/ultimateSlot/REEL.png')
    INSTANCE_REEL1.LOADED_OBJECT = function () {

    REEL.rotation.set(11, 11, 11)
    REEL.scale.set(37, 37, 37)
    REEL.position.setZ(45)
    REEL.position.setY(19)
    REEL.position.setX(-90)
    REEL.SPIN = false;

};

var INSTANCE_REEL2 = new IMPORT.OBJ('REEL2', 'res/ultimateSlot/reel.obj', 'res/ultimateSlot/REEL.png')
    INSTANCE_REEL2.LOADED_OBJECT = function () {

    REEL2.rotation.set(11, 11, 11)
    REEL2.scale.set(37, 37, 37)
    REEL2.position.setZ(45)
    REEL2.position.setY(19)
    REEL2.position.setX(-45)
    REEL2.SPIN = false;

};

var INSTANCE_REEL3 = new IMPORT.OBJ('REEL3', 'res/ultimateSlot/reel.obj', 'res/ultimateSlot/REEL.png')
    INSTANCE_REEL3.LOADED_OBJECT = function () {

    REEL3.rotation.set(11, 11, 11)
    REEL3.scale.set(37, 37, 37)
    REEL3.position.setZ(45)
    REEL3.position.setY(19)
    REEL3.position.setX(0)
    REEL3.SPIN = false;
};

var INSTANCE_REEL4 = new IMPORT.OBJ('REEL4', 'res/ultimateSlot/reel.obj', 'res/ultimateSlot/REEL.png')
    INSTANCE_REEL4.LOADED_OBJECT = function () {

    REEL4.rotation.set(11, 11, 11)
    REEL4.scale.set(37, 37, 37)
    REEL4.position.setZ(45)
    REEL4.position.setY(19)
    REEL4.position.setX(45)
    REEL4.SPIN = false;
};

var INSTANCE_REEL5 = new IMPORT.OBJ('REEL5', 'res/ultimateSlot/reel.obj', 'res/ultimateSlot/REEL.png')
    INSTANCE_REEL5.LOADED_OBJECT = function () {

    REEL5.rotation.set(11, 11, 11)
    REEL5.scale.set(37, 37, 37)
    REEL5.position.setZ(45)
    REEL5.position.setY(19)
    REEL5.position.setX(90)
    REEL5.SPIN = false;

    PROGRAM.AUTO_UPDATE.push(MASHINE_CONTROLER);

};

var sphere = new THREE.SphereGeometry(16, 16, 16);

var light1 = new THREE.PointLight(0xcce6ff, 1, 650);
light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xcce6ff
        })));
light1.position.setX(500);

var light2 = new THREE.PointLight(0x80c1ff, 1, 650);
light2.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0x80c1ff
        })));
light2.position.setX(-500);

var light3 = new THREE.PointLight(0xcce6ff, 1, 650);
light3.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xcce6ff
        })));
//light3.position.setX(500);
light3.position.setZ(500);

var light4 = new THREE.PointLight(0x80c1ff, 1, 650);
light4.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0x80c1ff
        })));
//light4.position.setX(-500);
light4.position.setZ(-500);

var lightX = new THREE.PointLight(0xcce6ff, 5, 777);
lightX.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
            color: 0xfee6ff
        })));
lightX.position.setX(-500);
lightX.position.setY(500);
lightX.position.setZ(200);

var earthPivot = new THREE.Object3D();
var earthPivotI = new THREE.Object3D();

var ROTATE_POINTLIGHT = {
    AUTO_UPDATE: function () {

        earthPivot.rotation.y += 0.02;

    }

};

earthPivot.add(light1)
earthPivot.add(light2)
earthPivot.add(light3)
earthPivot.add(light4)

scene.add(lightX);
scene.add(earthPivot);
PROGRAM.AUTO_UPDATE.push(ROTATE_POINTLIGHT);

var RAY_ = new Raycaster();

RAY_.BLOCK_SECUND = false;

RAY_.RECALL = function (o) {

    if (RAY_.BLOCK_SECUND == false) {

        RAY_.BLOCK_SECUND = true;

        console.log("raycast object name : " + o.name);
        if (o.name == 'RUCKA_Sphere') {

            console.log('rucka');
            SPIN()

        } else if (o.name == 'enable webcam' && typeof o.status == 'undefined') {

            o.status = 'webcam';
            ULTIMATE_MASHINE.CLIENT_WEB_CAM = new VIDEO_TEXTURE('video_for_ar');
            ULTIMATE_MASHINE.children[4].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            REEL.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            REEL2.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            REEL3.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            REEL4.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            REEL5.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
            text2.SET_TEXT("enable video")

            scene.remove(ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieScreen)

        } else if (o.name == 'enable webcam' && typeof o.status != 'undefined') {

            if (o.status == 'webcam') {

                /*
                 */

            } else if (o.status == 'video') {

                o.status = 'webcam';
                ULTIMATE_MASHINE.CLIENT_WEB_CAM = new VIDEO_TEXTURE('video_for_ar');
                ULTIMATE_MASHINE.children[4].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                REEL.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                REEL2.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                REEL3.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                REEL4.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                REEL5.children[0].material = ULTIMATE_MASHINE.CLIENT_WEB_CAM.movieMaterial;
                text2.SET_TEXT("enable video")

            }

        } else if (o.name == 'enable video') {

            text2.SET_TEXT("enable images")
            REEL.children[0].material = ANIMALS_MATERIAL.movieMaterial;
            REEL2.children[0].material = ANIMALS_MATERIAL.movieMaterial;
            REEL3.children[0].material = ANIMALS_MATERIAL.movieMaterial;
            REEL4.children[0].material = ANIMALS_MATERIAL.movieMaterial;
            REEL5.children[0].material = ANIMALS_MATERIAL.movieMaterial;

            ULTIMATE_MASHINE.children[4].material = ANIMALS_MATERIAL.movieMaterial;

        } else if (o.name == 'enable images') {

            text2.SET_TEXT("enable webcam")
            REEL.children[0].material = SAVE_MATERIALS_FROM_STARTUP.R1;
            REEL2.children[0].material = SAVE_MATERIALS_FROM_STARTUP.R2;
            REEL3.children[0].material = SAVE_MATERIALS_FROM_STARTUP.R3;
            REEL4.children[0].material = SAVE_MATERIALS_FROM_STARTUP.R4;
            REEL5.children[0].material = SAVE_MATERIALS_FROM_STARTUP.R5;

        }

        setTimeout(function () {

            RAY_.BLOCK_SECUND = false;

        }, 900);
    }

};

var testbrojac1 = 0, testbrojac2 = 0, testbrojac3 = 0, testbrojac4 = 0, testbrojac5 = 0;

var MASHINE_CONTROLER = {

    REZ1: 1,
    REZ2: 1,
    REZ3: 1,
    REZ4: 1,
    REZ5: 1,
    STOP1_ON_FIELD: 9999,
    STOP2_ON_FIELD: 9999,
    STOP3_ON_FIELD: 9999,
    STOP4_ON_FIELD: 9999,
    STOP5_ON_FIELD: 9999,

    AUTO_UPDATE: function () {

        if (REEL.SPIN == true) {
            if (testbrojac1 == MASHINE_CONTROLER.STOP1_ON_FIELD) {
                STOP(1)
            } else if (testbrojac1 == 72) {
                testbrojac1 = 0;
            } else {
                REEL.rotateZ(to_rad(-5));
                testbrojac1++;
            }
        }
        if (REEL2.SPIN == true) {
            if (testbrojac2 == MASHINE_CONTROLER.STOP2_ON_FIELD) {
                STOP(2)
            } else if (testbrojac2 == 72) {
                testbrojac2 = 0;
            } else {
                REEL2.rotateZ(to_rad(-5))
                testbrojac2++;
            }
        }
        if (REEL3.SPIN == true) {
            if (testbrojac3 == MASHINE_CONTROLER.STOP3_ON_FIELD) {
                STOP(3)
            } else if (testbrojac3 == 72) {
                testbrojac3 = 0;
            } else {
                REEL3.rotateZ(to_rad(-5));
                testbrojac3++;
            }
        }

        if (REEL4.SPIN == true) {
            if (testbrojac4 == MASHINE_CONTROLER.STOP4_ON_FIELD) {
                STOP(4)
            } else if (testbrojac4 == 72) {
                testbrojac4 = 0;
            } else {
                REEL4.rotateZ(to_rad(-5));
                testbrojac4++;
            }
        }

        if (REEL5.SPIN == true) {
            if (testbrojac5 == MASHINE_CONTROLER.STOP5_ON_FIELD) {
                STOP(5)
            } else if (testbrojac5 == 72) {
                testbrojac5 = 0;
            } else {
                REEL5.rotateZ(to_rad(-5));
                testbrojac5++;
            }
        }

    },

    SET_REZ: function (r1, r2, r3, r4, r5) {

        MASHINE_CONTROLER.REZ1 = r1;
        MASHINE_CONTROLER.REZ2 = r2;
        MASHINE_CONTROLER.REZ3 = r3;
        MASHINE_CONTROLER.REZ4 = r4;
        MASHINE_CONTROLER.REZ5 = r5;

        MASHINE_CONTROLER.eval_rez(1);
        MASHINE_CONTROLER.eval_rez(2);
        MASHINE_CONTROLER.eval_rez(3);
        MASHINE_CONTROLER.eval_rez(4);
        MASHINE_CONTROLER.eval_rez(5);

    },

    eval_rez: function (index, R) {

        eval("if (MASHINE_CONTROLER.REZ" + index + " == 1) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 6;}");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 12) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 12;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 11) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 18;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 10) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 24;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 9) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 30;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 8) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 36;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 7) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 42;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 6) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 48;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 5) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 54;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 4) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 60;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 3) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 66;} ");
        eval("if (MASHINE_CONTROLER.REZ" + index + " == 2) {MASHINE_CONTROLER.STOP" + index + "_ON_FIELD = 0;} ");

    },

};

function SPIN() {

    if (REEL5.SPIN == false) {

        REEL.SPIN = true;
        REEL2.SPIN = true;
        REEL3.SPIN = true;
        REEL4.SPIN = true;
        REEL5.SPIN = true;

        setTimeout(function () {

            MASHINE_CONTROLER.SET_REZ(randomIntFromTo(1, 12), randomIntFromTo(1, 12), randomIntFromTo(1, 12), randomIntFromTo(1, 12), randomIntFromTo(1, 12))

        }, 2000)

    }

}

function STOP(w) {

    if (w == 1) {

        REEL.SPIN = false;
    } else if (w == 2) {

        REEL2.SPIN = false;

    } else if (w == 3) {

        REEL3.SPIN = false;

    } else if (w == 4) {

        REEL4.SPIN = false;

    } else if (w == 5) {

        REEL5.SPIN = false;

    }

}

var YOUR_VOICE = new SYS.VOICE.LISTEN();

YOUR_VOICE.words.spin = {
    'action': SPIN
};
YOUR_VOICE.recognition.start();

YOUR_VOICE.recognition.onend = function () {

    YOUR_VOICE.recognition.start();

};

YOUR_VOICE.embbed_action.push("SPIN")

SYS.VOICE.SPEAK('welcome  , people , this is ultimate slot mashine basic template .  ');
