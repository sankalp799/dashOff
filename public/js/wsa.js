const WSA_COLORS = [
    '#ED553B',
    '#F6D55C',
    '#3CAEA3',
    '#AC92EB',
    '#A0D568',
    '#00A32A',
    '#ffffff'
];

let wsa_config = {
    speed: 5,
    speedAdjFactor: 0.03,
    density: 1,
    shape: "square",
    warpEffect: true,
    warpEffectLength: 8,
    depthFade: true,
    starSize: 5,
    backgroundColor: "hsl(263,45%,7%)",
    starColor: WSA_COLORS[Math.floor(Math.random() * WSA_COLORS.length)]
};

String.prototype.isBlank = function() {
    return !this || /^\s*$/.test(this);
}

function ChangeSettings(s) {
    if (typeof(s) == 'object') {
        Object.keys(s).forEach(sk => {
            wsa_config[sk] = s[sk];
        })
        applySettings();
    }
}

function applySettings() {
    new WarpSpeed("bgCanvas", wsa_config);
}

/*
setInterval(() => {
    ChangeSettings({
        starColor: WSA_COLORS[Math.floor(Math.random() * WSA_COLORS.length)]
    });
}, 5000)
*/

applySettings();