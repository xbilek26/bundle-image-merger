async function trimImage(img) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    context.drawImage(img, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    function isNonWhite(r, g, b, a) {
        const threshold = 200;
        return !(r > threshold && g > threshold && b > threshold && a === 255);
    }

    let top = imageData.height;
    let left = imageData.width;
    let right = 0;
    let bottom = 0;

    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const index = (y * imageData.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            if (isNonWhite(r, g, b, a)) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }

    const trimmedWidth = right - left + 1;
    const trimmedHeight = bottom - top + 1;

    const trimmedCanvas = document.createElement('canvas');
    const trimmedContext = trimmedCanvas.getContext('2d');
    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;

    trimmedContext.drawImage(canvas, left, top, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

    const trimmedImg = new Image();
    trimmedImg.src = trimmedCanvas.toDataURL('image/png');

    return trimmedImg;
}

async function loadImageOrFile(code, file) {
    return new Promise((resolve, reject) => {
        if (code) {
            const url = `https://image.alza.cz/products/${code}/${code}.jpg?width=500&height=500`;
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = async () => {
                try {
                    const trimmedImg = await trimImage(img);
                    resolve(trimmedImg);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = reject;
            img.src = url;
        } else if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = async () => {
                    try {
                        const trimmedImg = await trimImage(img);
                        resolve(trimmedImg);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        } else {
            reject(new Error('No image source provided'));
        }
    });
}

async function mergeImages() {
    const code1 = document.getElementById('code1').value;
    const code2 = document.getElementById('code2').value;

    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    try {
        const [img1, img2] = await Promise.all([
            loadImageOrFile(code1, file1),
            loadImageOrFile(code2, file2)
        ]);

        const maxHeight = Math.max(img1.height, img2.height);
        const totalWidth = img1.width + img2.width + 10;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = totalWidth;
        canvas.height = maxHeight;

        context.drawImage(img1, 0, 0, img1.width, maxHeight);

        context.fillStyle = 'white';
        context.fillRect(img1.width, 0, 10, maxHeight);

        context.drawImage(img2, img1.width + 10, 0, img2.width, maxHeight);

        const resultImage = canvas.toDataURL('image/png');
        const resultImageElement = document.getElementById('result-image');
        resultImageElement.src = resultImage;
        resultImageElement.style.display = 'block';

        const filename = `${code1 || 'image1'}+${code2 || 'image2'}.png`;
        downloadImage(resultImage, filename);
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
