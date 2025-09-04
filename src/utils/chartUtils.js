// Simple chart utility for rendering basic charts without external dependencies

export const renderBarChart = (canvas, data, options = {}) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (!data || !data.labels || !data.datasets || data.labels.length === 0) {
    return;
  }
  
  const chartData = data.datasets[0];
  const labels = data.labels;
  const values = chartData.data;
  
  // Chart dimensions
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Find min and max values
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;
  
  // Bar dimensions
  const barWidth = chartWidth / labels.length * 0.8;
  const barSpacing = chartWidth / labels.length * 0.2;
  
  // Draw title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || 'Chart', width / 2, 20);
  
  // Draw Y-axis
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.stroke();
  
  // Draw X-axis
  ctx.beginPath();
  ctx.moveTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  // Draw Y-axis labels
  ctx.fillStyle = '#666';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = margin.top + (chartHeight / ySteps) * i;
    const value = maxValue - (valueRange / ySteps) * i;
    ctx.fillText(value.toFixed(1) + '%', margin.left - 10, y + 4);
    
    // Draw grid line
    if (i > 0) {
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
  }
  
  // Draw bars
  labels.forEach((label, index) => {
    const value = values[index];
    const x = margin.left + (chartWidth / labels.length) * index + barSpacing / 2;
    const barHeight = (value / maxValue) * chartHeight;
    const y = height - margin.bottom - barHeight;
    
    // Bar color based on value
    let color;
    if (value >= 85) color = '#2E7D32';
    else if (value >= 75) color = '#1976D2';
    else if (value >= 60) color = '#F57C00';
    else color = '#D32F2F';
    
    // Draw bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw bar border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Draw value on bar
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value.toFixed(1) + '%', x + barWidth / 2, y - 5);
    
    // Draw label
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth / 2, height - margin.bottom + 20);
  });
};

export const renderLineChart = (canvas, data, options = {}) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (!data || !data.labels || !data.datasets || data.labels.length === 0) {
    return;
  }
  
  const chartData = data.datasets[0];
  const labels = data.labels;
  const values = chartData.data;
  
  // Chart dimensions
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Find min and max values
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;
  
  // Draw title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || 'Chart', width / 2, 20);
  
  // Draw axes
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  // Draw grid lines
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  const ySteps = 5;
  for (let i = 1; i < ySteps; i++) {
    const y = margin.top + (chartHeight / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();
  }
  
  // Draw line
  ctx.strokeStyle = chartData.borderColor || '#2196F3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  labels.forEach((label, index) => {
    const value = values[index];
    const x = margin.left + (chartWidth / (labels.length - 1)) * index;
    const y = height - margin.bottom - ((value - minValue) / valueRange) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = chartData.backgroundColor || '#2196F3';
  labels.forEach((label, index) => {
    const value = values[index];
    const x = margin.left + (chartWidth / (labels.length - 1)) * index;
    const y = height - margin.bottom - ((value - minValue) / valueRange) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
  
  // Draw labels
  ctx.fillStyle = '#666';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  labels.forEach((label, index) => {
    const x = margin.left + (chartWidth / (labels.length - 1)) * index;
    ctx.fillText(label, x, height - margin.bottom + 20);
  });
};

export const renderPieChart = (canvas, data, options = {}) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  if (!data || !data.labels || !data.datasets || data.labels.length === 0) {
    return;
  }
  
  const chartData = data.datasets[0];
  const labels = data.labels;
  const values = chartData.data;
  
  // Chart dimensions
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;
  
  // Calculate total
  const total = values.reduce((sum, value) => sum + value, 0);
  
  // Draw title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(options.title || 'Chart', centerX, 30);
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start from top
  
  values.forEach((value, index) => {
    const sliceAngle = (value / total) * 2 * Math.PI;
    
    // Draw slice
    ctx.fillStyle = chartData.backgroundColor[index] || getDefaultColor(index);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    // Draw slice border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius + 20;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;
    
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labels[index], labelX, labelY);
    
    // Draw percentage
    const percentage = ((value / total) * 100).toFixed(1) + '%';
    ctx.fillText(percentage, labelX, labelY + 15);
    
    currentAngle += sliceAngle;
  });
};

const getDefaultColor = (index) => {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];
  return colors[index % colors.length];
};
