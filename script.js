// Global variables
let canvas = null;
let ctx = null;
let isDrawing = false;
let savedSignature = null;
let currentFileType = null;
let originalFileName = null;

// Initialize canvas when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('signatureCanvas');
    ctx = canvas.getContext('2d');
    initializeCanvas();
    setupEventListeners();
});

// Canvas initialization
function initializeCanvas() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
}

// Event listeners setup
function setupEventListeners() {
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // File upload
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    canvas.classList.add('active');
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
    if (!isDrawing) return;
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    canvas.classList.remove('active');
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top)
    };
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// Signature management
function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateSignatureStatus('');
}

function saveSignature() {
    if (isCanvasEmpty()) {
        updateSignatureStatus('Please draw your signature first', 'info');
        return;
    }
    
    savedSignature = canvas.toDataURL('image/png');
    updateSignatureStatus('Signature saved successfully!', 'success');
}

function isCanvasEmpty() {
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
}

function updateSignatureStatus(message, type = '') {
    const status = document.getElementById('signatureStatus');
    if (message) {
        status.innerHTML = `<div class="status status-${type}">${message}</div>`;
    } else {
        status.innerHTML = '';
    }
}

// Document handling
function createSampleDoc() {
    const docArea = document.getElementById('documentArea');
    docArea.className = 'document-area has-content';
    
    // Set as HTML document type for sample
    currentFileType = 'text/html';
    originalFileName = 'sample-document.html';
    
    docArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="text-align: center; margin-bottom: 30px;">Agreement Document</h2>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <br>
            <p>This is a sample document that demonstrates the digital signature functionality. You can replace this with your own document by uploading an image file.</p>
            <br>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <br>
            <div style="margin-top: 60px;">
                <p><strong>Signature:</strong></p>
                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px 0; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                    <small style="color: #666;">Click here to sign</small>
                </div>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
    document.getElementById('downloadBtn').disabled = false;
}

function placeSignatureHere(element) {
    if (!savedSignature) {
        alert('Please create and save your signature first!');
        return;
    }
    
    const img = document.createElement('img');
    img.src = savedSignature;
    img.style.width = '180px';
    img.style.height = '50px';
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.className = 'signature-placed';
    
    element.innerHTML = '';
    element.appendChild(img);
    element.style.border = 'none';
}

// File upload handling
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Store file info for download
    currentFileType = fileType;
    originalFileName = file.name;
    
    reader.onload = function(e) {
        const docArea = document.getElementById('documentArea');
        docArea.className = 'document-area has-content';
        
        if (fileType.startsWith('image/')) {
            displayImageDocument(e.target.result);
        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            displayPDFDocument(file);
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            displayTextDocument(e.target.result);
        } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
                  fileType.includes('document') || fileType.includes('word')) {
            displayWordDocument(file);
        } else if (fileName.endsWith('.rtf')) {
            displayRTFDocument(e.target.result);
        } else {
            docArea.innerHTML = `
                <div style="text-align: center; color: #dc2626; padding: 40px;">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="margin-bottom: 16px;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <h3>Unsupported File Format</h3>
                    <p>Please upload: Images (JPG, PNG), PDFs, Word docs, or text files</p>
                </div>
            `;
        }
        
        document.getElementById('downloadBtn').disabled = false;
    };
    
    // Read file based on type
    if (fileType.startsWith('image/') || fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.rtf')) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function displayImageDocument(src) {
    const docArea = document.getElementById('documentArea');
    
    // Ensure file type is preserved for images
    if (!currentFileType || !currentFileType.startsWith('image/')) {
        currentFileType = 'image/png'; // fallback
    }
    
    docArea.innerHTML = `
        <div style="position: relative;">
            <img src="${src}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" alt="Uploaded document">
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-primary" onclick="addSignatureToDocument()">Add Signature</button>
            </div>
        </div>
    `;
}

function displayTextDocument(src) {
    const text = atob(src.split(',')[1]);
    const docArea = document.getElementById('documentArea');
    docArea.innerHTML = `
        <div style="font-family: 'Courier New', monospace; background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; white-space: pre-wrap; line-height: 1.6; position: relative;">
${text}
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px 0; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                    <small style="color: #666;">Click here to sign</small>
                </div>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function displayPDFDocument(file) {
    const docArea = document.getElementById('documentArea');
    
    // Store PDF file info
    currentFileType = 'application/pdf';
    originalFileName = file.name;
    
    if (typeof pdfjsLib === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = function() {
            processPDF(file);
        };
        script.onerror = function() {
            showPDFPreview(file);
        };
        document.head.appendChild(script);
    } else {
        processPDF(file);
    }
}

function processPDF(file) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        const typedarray = new Uint8Array(e.target.result);
        
        pdfjsLib.getDocument({data: typedarray}).promise.then(function(pdf) {
            const docArea = document.getElementById('documentArea');
            let allPagesHtml = '';
            let pagesLoaded = 0;
            
            // Simple: get all pages and display them
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                pdf.getPage(pageNum).then(function(page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({scale: scale});
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    page.render({canvasContext: context, viewport: viewport}).promise.then(function() {
                        const imgData = canvas.toDataURL();
                        allPagesHtml += `<img src="${imgData}" style="width: 100%; margin-bottom: 10px; display: block;">`;
                        
                        pagesLoaded++;
                        if (pagesLoaded === pdf.numPages) {
                            // All pages loaded, show them
                            docArea.innerHTML = `
                                <div style="position: relative;">
                                    ${allPagesHtml}
                                    <button class="btn btn-primary" onclick="addSignatureToDocument()" style="margin-top: 20px;">Add Signature</button>
                                </div>
                            `;
                        }
                    });
                });
            }
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function showPDFPreview(file) {
    const docArea = document.getElementById('documentArea');
    const fileURL = URL.createObjectURL(file);
    docArea.innerHTML = `
        <div style="text-align: center;">
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
                <svg width="64" height="64" fill="#dc2626" viewBox="0 0 24 24" style="margin-bottom: 16px;">
                    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v1h-1.5V7h3v1.5zM9 9.5h1v-1H9v1z"/>
                </svg>
                <h3>PDF Document</h3>
                <p style="color: #64748b; margin-bottom: 20px;">${file.name}</p>
                <a href="${fileURL}" target="_blank" class="btn btn-outline" style="text-decoration: none;">View PDF</a>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; position: relative;">
                <p style="margin-bottom: 40px;">This PDF will be signed digitally. Your signature will be added to the document.</p>
                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px auto; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                    <small style="color: #666;">Click here to sign</small>
                </div>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function displayWordDocument(file) {
    const docArea = document.getElementById('documentArea');
    
    if (typeof mammoth !== 'undefined') {
        const reader = new FileReader();
        reader.onload = function(e) {
            mammoth.extractRawText({arrayBuffer: e.target.result})
                .then(function(result) {
                    docArea.innerHTML = `
                        <div style="font-family: Arial, sans-serif; background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.6; position: relative;">
                            <div style="white-space: pre-wrap;">${result.value}</div>
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px 0; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                                    <small style="color: #666;">Click here to sign</small>
                                </div>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    `;
                })
                .catch(function(err) {
                    showWordPreview(file);
                });
        };
        reader.readAsArrayBuffer(file);
    } else {
        showWordPreview(file);
    }
}

function showWordPreview(file) {
    const docArea = document.getElementById('documentArea');
    docArea.innerHTML = `
        <div style="text-align: center;">
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
                <svg width="64" height="64" fill="#2563eb" viewBox="0 0 24 24" style="margin-bottom: 16px;">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <h3>Word Document</h3>
                <p style="color: #64748b; margin-bottom: 20px;">${file.name}</p>
                <p style="color: #64748b; font-size: 0.875rem;">Document content will be processed for signing</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; position: relative;">
                <p style="margin-bottom: 40px;">This Word document will be signed digitally. Your signature will be added to the document.</p>
                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px auto; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                    <small style="color: #666;">Click here to sign</small>
                </div>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function displayRTFDocument(src) {
    const rtfContent = atob(src.split(',')[1]);
    const cleanText = rtfContent.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '');
    
    const docArea = document.getElementById('documentArea');
    docArea.innerHTML = `
        <div style="font-family: Arial, sans-serif; background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.6; position: relative;">
            <div style="white-space: pre-wrap;">${cleanText}</div>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <div style="width: 200px; height: 60px; border-bottom: 1px solid #ccc; margin: 20px 0; position: relative; cursor: pointer;" onclick="placeSignatureHere(this)">
                    <small style="color: #666;">Click here to sign</small>
                </div>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

function addSignatureToDocument() {
    if (!savedSignature) {
        alert('Please create and save your signature first!');
        return;
    }
    
    const docArea = document.getElementById('documentArea');
    const img = document.createElement('img');
    img.src = savedSignature;
    img.style.position = 'absolute';
    img.style.top = '50px';
    img.style.left = '50px';
    img.style.width = '150px';
    img.style.height = '60px';
    img.className = 'signature-placed';
    img.style.zIndex = '10';
    
    makeDraggable(img);
    
    docArea.style.position = 'relative';
    docArea.appendChild(img);
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Download functionality
function downloadDocument() {
    const docArea = document.getElementById('documentArea');
    
    // Determine download format based on original file type
    if (currentFileType && currentFileType === 'application/pdf') {
        downloadAsPDF();
    } else if (currentFileType && currentFileType.startsWith('image/')) {
        downloadAsImage();
    } else if (currentFileType && (currentFileType === 'text/plain' || originalFileName.endsWith('.txt'))) {
        downloadAsText();
    } else if (currentFileType && (currentFileType.includes('document') || currentFileType.includes('word') || originalFileName.endsWith('.doc') || originalFileName.endsWith('.docx'))) {
        downloadAsWord();
    } else {
        // Default to image for sample documents
        downloadAsImage();
    }
}

function downloadAsImage() {
    const docArea = document.getElementById('documentArea');
    
    if (typeof html2canvas !== 'undefined') {
        html2canvas(docArea, {
            useCORS: true,
            allowTaint: true,
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            onclone: function(clonedDoc) {
                const clonedArea = clonedDoc.getElementById('documentArea');
                if (clonedArea) {
                    clonedArea.style.height = 'auto';
                    clonedArea.style.minHeight = 'auto';
                }
            }
        }).then(canvas => {
            const ext = getImageExtension();
            downloadCanvas(canvas, `signed-document.${ext}`);
        }).catch(error => {
            console.error('html2canvas failed:', error);
            manualCanvasDownload();
        });
    } else {
        loadHtml2Canvas().then(() => {
            downloadAsImage();
        }).catch(() => {
            manualCanvasDownload();
        });
    }
}

function downloadAsPDF() {
    // For PDF, we'll create an image first, then embed it in a PDF
    const docArea = document.getElementById('documentArea');
    
    // Load jsPDF library first
    loadJsPDF().then(() => {
        if (typeof html2canvas !== 'undefined') {
            html2canvas(docArea, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            }).then(canvas => {
                createPDFFromCanvas(canvas);
            }).catch(error => {
                console.error('html2canvas failed for PDF:', error);
                // Fallback to manual canvas creation
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scale = 2;
                canvas.width = Math.max(docArea.scrollWidth, 800) * scale;
                canvas.height = Math.max(docArea.scrollHeight, 600) * scale;
                ctx.scale(scale, scale);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
                
                processDocumentContent(ctx, docArea).then(() => {
                    createPDFFromCanvas(canvas);
                });
            });
        } else {
            loadHtml2Canvas().then(() => {
                downloadAsPDF();
            }).catch(() => {
                // Final fallback - create manual canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const scale = 2;
                canvas.width = Math.max(docArea.scrollWidth, 800) * scale;
                canvas.height = Math.max(docArea.scrollHeight, 600) * scale;
                ctx.scale(scale, scale);
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
                
                processDocumentContent(ctx, docArea).then(() => {
                    createPDFFromCanvas(canvas);
                });
            });
        }
    }).catch(() => {
        alert('Unable to load PDF library. Download will be saved as image instead.');
        downloadAsImage();
    });
}

function createPDFFromCanvas(canvas) {
    try {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Calculate how many pages we need
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        for (let i = 0; i < totalPages; i++) {
            if (i > 0) {
                pdf.addPage();
            }
            
            const yOffset = -(i * pageHeight);
            pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
        }
        
        const fileName = originalFileName ? 
            originalFileName.replace(/\.[^/.]+$/, '') + '_signed.pdf' : 
            'signed-document.pdf';
        
        pdf.save(fileName);
        
    } catch (error) {
        console.error('PDF creation failed:', error);
        alert('PDF creation failed. Download will be saved as image instead.');
        downloadCanvas(canvas, 'signed-document.png');
    }
}

function downloadAsText() {
    const docArea = document.getElementById('documentArea');
    const textContent = docArea.innerText || docArea.textContent;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') + '_signed.txt' : 'signed-document.txt';
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadAsWord() {
    // For Word documents, we'll create an HTML file that Word can open
    const docArea = document.getElementById('documentArea');
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Signed Document</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            ${docArea.innerHTML}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, '') + '_signed.html' : 'signed-document.html';
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function getImageExtension() {
    if (currentFileType) {
        if (currentFileType.includes('jpeg') || currentFileType.includes('jpg')) return 'jpg';
        if (currentFileType.includes('png')) return 'png';
        if (currentFileType.includes('gif')) return 'gif';
        if (currentFileType.includes('webp')) return 'webp';
    }
    return 'png'; // default
}

function loadJsPDF() {
    return new Promise((resolve, reject) => {
        if (typeof jsPDF !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            window.jsPDF = window.jspdf.jsPDF;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function manualCanvasDownload() {
    const docArea = document.getElementById('documentArea');
    
    // Check if we should download as PDF
    if (currentFileType && currentFileType === 'application/pdf') {
        downloadAsPDF();
        return;
    }
    
    // Check if we should download as text
    if (currentFileType && (currentFileType === 'text/plain' || (originalFileName && originalFileName.endsWith('.txt')))) {
        downloadAsText();
        return;
    }
    
    // Check if we should download as Word/HTML
    if (currentFileType && (currentFileType.includes('document') || currentFileType.includes('word') || (originalFileName && (originalFileName.endsWith('.doc') || originalFileName.endsWith('.docx'))))) {
        downloadAsWord();
        return;
    }
    
    // Default to image download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 2;
    canvas.width = Math.max(docArea.scrollWidth, 800) * scale;
    canvas.height = Math.max(docArea.scrollHeight, 600) * scale;
    ctx.scale(scale, scale);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    
    processDocumentContent(ctx, docArea).then(() => {
        const ext = getImageExtension();
        downloadCanvas(canvas, `signed-document.${ext}`);
    });
}

function processDocumentContent(ctx, element) {
    return new Promise((resolve) => {
        const images = element.querySelectorAll('img');
        const texts = element.querySelectorAll('div, p, h1, h2, h3, span');
        let loadedCount = 0;
        const totalImages = images.length;
        
        texts.forEach(textElement => {
            if (textElement.textContent.trim() && !textElement.querySelector('img')) {
                const rect = textElement.getBoundingClientRect();
                const docRect = element.getBoundingClientRect();
                const x = rect.left - docRect.left;
                const y = rect.top - docRect.top;
                
                ctx.fillStyle = '#000000';
                ctx.font = '14px Arial, sans-serif';
                
                const lines = textElement.textContent.split('\n');
                lines.forEach((line, index) => {
                    if (line.trim()) {
                        ctx.fillText(line, x, y + (index * 20) + 15);
                    }
                });
            }
        });
        
        if (totalImages === 0) {
            resolve();
            return;
        }
        
        images.forEach(img => {
            const newImg = new Image();
            newImg.crossOrigin = 'anonymous';
            
            newImg.onload = function() {
                const rect = img.getBoundingClientRect();
                const docRect = element.getBoundingClientRect();
                const x = rect.left - docRect.left;
                const y = rect.top - docRect.top;
                
                try {
                    ctx.drawImage(newImg, x, y, img.offsetWidth, img.offsetHeight);
                } catch (e) {
                    console.warn('Could not draw image:', e);
                }
                
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            
            newImg.onerror = function() {
                console.warn('Could not load image:', img.src);
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            
            newImg.src = img.src;
        });
    });
}

function downloadCanvas(canvas, filename = 'signed-document.png') {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    let hasContent = false;
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
            hasContent = true;
            break;
        }
    }
    
    if (!hasContent) {
        alert('No content detected in document. Please make sure your document is properly loaded.');
        return;
    }
    
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
}