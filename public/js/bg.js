const bg = document.getElementById('bg-canvas');
const bgWrapper = document.getElementById('bg-wrapper');
const bgctx = bg.getContext('2d');
let html_dom = document.querySelector('html');
let particles = [];
let bg_color_arr = ['#556270',
    '#2d3436',
    '#56a292',
    '#ffa801',
    '#27ae60',
    '#e4844a',
    '#d35400',
    '#82589F',
    '#182C61'
];

if (sessionStorage.getItem('bgColor') === null)
    sessionStorage.setItem('bgColor', bg_color_arr[Math.floor(Math.random() * bg_color_arr.length)]);


bgWrapper.style.backgroundColor = sessionStorage.getItem('bgColor');

bg.width = bgWrapper.offsetWidth;
bg.height = bgWrapper.offsetHeight;

window.addEventListener('resize', (e) => {
    bg.width = bgWrapper.offsetWidth;
    bg.height = bgWrapper.offsetHeight;
});

/*********
bgctx.fillStyle = 'white';
bgctx.font = '30px arial';
bgctx.fillText('Sankalp', 0, 30);
const textPos = bgctx.getImageData(0, 0, 100, 100);
console.log(textPos.data);
*/


let mousePos = {
    x: null,
    y: null,
    r: 150,
    d: 100,
};

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.x;
    mousePos.y = e.y;
    // bgctx.translate(e.x, e.y);
});

window.addEventListener('scroll', (e) => {
    console.log('scrolling...');
})


class Particle {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.baseX = this.x;
        this.size = 2;
        this.color = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
        this.baseY = this.y;
        this.speedX = Math.random() < 0.5 ? -0.1 : 0.1;
        this.speedY = Math.random() < 0.5 ? -0.1 : 0.1;
        this.density = Math.random() * 50;
        this.DisX = false;
        this.DisY = false;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.beginPath();
        // context.save();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // context.restore();
        context.closePath();
        context.fill();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        /****/
        if (this.x <= 0) {
            this.speedX = Math.abs(this.speedX);
        }
        if (this.x >= bg.width) {
            this.speedX = -1 * (this.speedX);
        }
        if (this.y <= 0) {
            this.speedY = Math.abs(this.speedY);
        }
        if (this.y >= bg.height) {
            this.speedY = -1 * (this.speedY);
        }

        // cal distance between mouse and particles
        let dx = mousePos.x - this.x;
        let dy = mousePos.y - this.y;
        let dis = Math.sqrt(dx * dx + dy * dy);
        let Fx = dx / dis;
        let Fy = dy / dis;
        let maxDis = mousePos.r;
        let F = (maxDis - dis) / maxDis;
        let DirX = F * Fx * this.density;
        let DirY = F * Fy * this.density;
        if (dis < 100) {
            this.x -= DirX * 1.5;
            this.y -= DirY * 1.5;
            this.DisX = true;
            this.DisY = true;
        } else {
            // check original position
            if (this.x !== this.baseX && this.DisX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            } else {
                this.DisX = false;
            }
            if (this.y !== this.baseY && this.DisY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            } else {
                this.DisY = false;
            }

        }
    }
}


for (let e = 0; e < 5000; e++) {
    particles.push(new Particle(bg.width, bg.height));
}

/************
for (let e = 0; e < textPos.height; e++) {
    for (let n = 0; n < textPos.width; n++) {
        if (textPos.data[(e * 4 * textPos.width) + (n * 4) + (n * 4 + 3)] > 128) {
            let Px = (n + 20) * 10;
            let Py = (e + 20) * 10;
            particles.push(new Particle(Px, Py));
        }
    }
}

**/


let init = () => {
    bgctx.clearRect(0, 0, bg.width, bg.height);
    particles.forEach(p => {
        p.draw(bgctx);
        p.update();
    });
    requestAnimationFrame(init);
};


init();