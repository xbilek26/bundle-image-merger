document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="text"]');

    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            e.preventDefault();
        });

        input.addEventListener('paste', (e) => {
        });

        input.addEventListener('focus', (e) => {
            e.target.select();
        });
    });
});

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

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = img1.width + img2.width;
        canvas.height = Math.max(img1.height, img2.height);

        context.drawImage(img1, 0, 0);
        context.drawImage(img2, img1.width, 0);

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

function loadImageOrFile(code, file) {
    return new Promise((resolve, reject) => {
        if (code) {
            const url = `https://image.alza.cz/products/${code}/${code}.jpg?width=500&height=500`;
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        } else if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => resolve(img);
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

function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
