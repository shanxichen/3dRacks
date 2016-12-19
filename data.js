var dataJson = {
    objects: [
        {
            "type": 'floor',
            "width": 1600,
            "depth": 1300,
        }, {
            "type": 'floor_cut',
            "width": 200,
            "height": 20,
            "depth": 260,
            "translate": [-348, 0, 530],
            "rotate": [Math.PI / 180 * 3, 0, 0],
        }, {
            "type": 'wall',
            "height": 200,
            "translate": [-500, 0, -500],
            "data": [
                [0, 0],
                [1000, 0],
                [1000, 1000],
                [0, 1000],
                [0, 0]
            ],
            "children": [{
                "type": 'window',
                "translate": [200, 30, 500],
                "width": 420,
                "height": 150,
                "depth": 50,
            }, {
                "type": 'door',
                "width": 205,
                "height": 180,
                "depth": 26,
                "translate": [-350, 0, 500],
            }],
        }, {
            "type": 'rail',
            "data": [
                [-180, 250],
                [-400, 250],
                [-400, -250],
                [400, -250]
            ],
        }, {
            type: 'plants',
            shadow: true,
            translates: [[560, 0, 400], [560, 0, 0], [560, 0, -400], [-560, 0, 400], [-560, 0, 0], [-560, 0, -400]],
        }, {
            type: 'plants',
            scale: [0.5, 0.3, 0.5],
            shadow: false,
            translates: [[100, 27, 520], [300, 27, 520]],
        }, {
            type: 'glass_wall',
            width: 1300,
            rotate: [0, Math.PI / 180 * 90, 0],
            translate: [-790, 0, 0],
        }, {
            type: 'glass_wall',
            width: 1300,
            rotate: [0, Math.PI / 180 * 90, 0],
            translate: [790, 0, 0],
        }, {
            type: 'tv',
            translate: [-130, 100, 513],
        }, {
            type: 'post',
            translate: [0, 110, -490],
            width: 70,
            height: 120,
            pic: demo.getRes('post.jpg'),
        }, {
            type: 'camera',
            translate: [470, 200, 400],
            angle: 90,
        }, {
            type: 'camera',
            translate: [470, 200, 0],
            angle: 90,
        }, {
            type: 'camera',
            translate: [-450, 200, -470],
            alarm: mono.AlarmSeverity.WARNING,
        }]
};