/**
 * Canvas编辑逻辑
 */

export interface CanvasEditorOptions {
  canvas: HTMLCanvasElement;
  brushSize: number;
  brushColor: number; // 0-255
  brushShape: 'circle' | 'square';
  eraserSize: number;
  zoomLevel?: number;
}

export class CanvasEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private isDrawingEnabled: boolean = true;
  private lastX: number = 0;
  private lastY: number = 0;
  private options: CanvasEditorOptions;
  private history: ImageData[] = [];
  private historyIndex: number = -1;
  private zoomLevel: number = 100;
  private originalBrushColor: number;
  private originalBrushSize: number;
  
  constructor(options: CanvasEditorOptions) {
    this.canvas = options.canvas;
    this.options = options;
    this.zoomLevel = options.zoomLevel || 100;
    this.originalBrushColor = options.brushColor;
    this.originalBrushSize = options.brushSize;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }
    this.ctx = ctx;
    
    this.setupEventListeners();
  }
  
  public setZoomLevel(zoom: number) {
    this.zoomLevel = zoom;
  }
  
  public setBrushColor(color: number) {
    this.options.brushColor = color;
    this.originalBrushColor = color;
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
  }
  
  private startDrawing(e: MouseEvent) {
    if (!this.isDrawingEnabled) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const scale = (this.zoomLevel / 100) * (this.canvas.width / rect.width);
    this.lastX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    this.lastY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    this.saveState();
  }
  
  private draw(e: MouseEvent) {
    if (!this.isDrawingEnabled || !this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const currentY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.strokeStyle = `rgb(${this.options.brushColor}, ${this.options.brushColor}, ${this.options.brushColor})`;
    this.ctx.lineWidth = this.options.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    
    this.lastX = currentX;
    this.lastY = currentY;
  }
  
  private stopDrawing() {
    this.isDrawing = false;
  }
  
  private saveState() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(imageData);
    this.historyIndex++;
    
    // 限制历史记录长度
    if (this.history.length > 20) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  public setBrushSize(size: number) {
    this.options.brushSize = size;
  }
  
  public setBrushShape(shape: 'circle' | 'square') {
    this.options.brushShape = shape;
  }
  
  public setEraserSize(size: number) {
    this.options.eraserSize = size;
  }
  
  public enableEraser() {
    this.originalBrushColor = this.options.brushColor;
    this.originalBrushSize = this.options.brushSize;
    this.options.brushColor = 255; // 白色
    this.options.brushSize = this.options.eraserSize;
  }
  
  public enableBrush() {
    this.options.brushColor = this.originalBrushColor;
    this.options.brushSize = this.originalBrushSize;
  }
  
  public disableDrawing() {
    this.isDrawingEnabled = false;
  }
  
  public enableDrawing() {
    this.isDrawingEnabled = true;
  }
  
  public clear() {
    this.saveState();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  public undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
    }
  }
  
  public redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const imageData = this.history[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
    }
  }
  
  public getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  
  public setImageData(imageData: ImageData) {
    this.saveState();
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
  }
  
  public drawRobot(x: number, y: number, theta: number, size: number, color: string) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(theta);
    
    // 绘制机器人图标（箭头）
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(size, 0);
    this.ctx.lineTo(-size/2, -size/2);
    this.ctx.lineTo(-size/2, size/2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  public drawGoalPoint(x: number, y: number, size: number, color: string, name?: string) {
    // 绘制点位
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size/2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 绘制名称
    if (name) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(name, x, y - size/2 - 5);
    }
  }
  
  public drawPath(points: {x: number, y: number}[], color: string, width: number) {
    if (points.length < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
  }
}