'use client';

import { useEffect, useRef, useState } from 'react';

export default function MetricsReportPage() {
  const confusionMatrixRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const precisionRecallRef = useRef<HTMLCanvasElement>(null);
  const f1ScoreRef = useRef<HTMLCanvasElement>(null);
  const rougeScoresRef = useRef<HTMLCanvasElement>(null);

  // Sample data - you can replace with real data
  const confusionMatrix = {
    truePositives: 85,
    trueNegatives: 92,
    falsePositives: 8,
    falseNegatives: 15,
  };

  const metrics = {
    accuracy: 0.885,
    precision: 0.914,
    recall: 0.850,
    f1Score: 0.881,
  };

  const rougeScores = {
    rouge1: 0.452,
    rougeL: 0.431,
    rouge2: 0.385,
  };

  const drawConfusionMatrix = () => {
    const canvas = confusionMatrixRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellWidth = width / 3;
    const cellHeight = height / 3;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set font
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw grid
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(cellWidth, 0);
    ctx.lineTo(cellWidth, height);
    ctx.moveTo(cellWidth * 2, 0);
    ctx.lineTo(cellWidth * 2, height);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, cellHeight);
    ctx.lineTo(width, cellHeight);
    ctx.moveTo(0, cellHeight * 2);
    ctx.lineTo(width, cellHeight * 2);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#000';
    ctx.fillText('Predicted', width / 2, cellHeight / 2);
    ctx.fillText('Actual', cellWidth / 2, cellHeight / 2);

    ctx.font = '16px Arial';
    ctx.fillText('Positive', cellWidth * 1.5, cellHeight / 2);
    ctx.fillText('Negative', cellWidth * 2.5, cellHeight / 2);
    ctx.save();
    ctx.translate(cellWidth / 2, cellHeight * 1.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Positive', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(cellWidth / 2, cellHeight * 2.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Negative', 0, 0);
    ctx.restore();

    // Values
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#000';

    // TP (bright green)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(cellWidth + 1, cellHeight + 1, cellWidth - 2, cellHeight - 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(confusionMatrix.truePositives.toString(), cellWidth * 1.5, cellHeight * 1.5);

    // FN (orange) - Actual Positive, Predicted Negative
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(cellWidth * 2 + 1, cellHeight + 1, cellWidth - 2, cellHeight - 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(confusionMatrix.falseNegatives.toString(), cellWidth * 2.5, cellHeight * 1.5);

    // FP (red) - Actual Negative, Predicted Positive
    ctx.fillStyle = '#F44336';
    ctx.fillRect(cellWidth + 1, cellHeight * 2 + 1, cellWidth - 2, cellHeight - 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(confusionMatrix.falsePositives.toString(), cellWidth * 1.5, cellHeight * 2.5);

    // TN (blue)
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(cellWidth * 2 + 1, cellHeight * 2 + 1, cellWidth - 2, cellHeight - 2);
    ctx.fillStyle = '#fff';
    ctx.fillText(confusionMatrix.trueNegatives.toString(), cellWidth * 2.5, cellHeight * 2.5);
  };

  const drawAccuracyChart = () => {
    const canvas = accuracyChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw accuracy bar
    const barWidth = chartWidth * 0.6;
    const barHeight = metrics.accuracy * chartHeight;
    const barX = padding + (chartWidth - barWidth) / 2;
    const barY = height - padding - barHeight;

    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Accuracy', width / 2, padding - 10);
    ctx.font = '18px Arial';
    ctx.fillText((metrics.accuracy * 100).toFixed(1) + '%', width / 2, height - padding + 30);

    // Y-axis labels
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight * (1 - i / 10));
      ctx.fillText((i * 10).toString() + '%', padding - 10, y + 4);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      ctx.stroke();
    }
  };

  const drawPrecisionRecall = () => {
    const canvas = precisionRecallRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = chartWidth / 3;
    const metricsList = [
      { name: 'Precision', value: metrics.precision, color: '#2196F3' },
      { name: 'Recall', value: metrics.recall, color: '#FF9800' },
    ];

    metricsList.forEach((metric, index) => {
      const barHeight = metric.value * chartHeight;
      const barX = padding + barWidth / 2 + index * (barWidth + barWidth);
      const barY = height - padding - barHeight;

      ctx.fillStyle = metric.color;
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(metric.name, barX + barWidth / 2, height - padding + 20);
      ctx.font = '16px Arial';
      ctx.fillText((metric.value * 100).toFixed(1) + '%', barX + barWidth / 2, barY - 10);
    });

    // Title
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Precision & Recall', width / 2, padding - 10);
  };

  const drawF1Score = () => {
    const canvas = f1ScoreRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw F1 Score bar
    const barWidth = chartWidth * 0.6;
    const barHeight = metrics.f1Score * chartHeight;
    const barX = padding + (chartWidth - barWidth) / 2;
    const barY = height - padding - barHeight;

    ctx.fillStyle = '#9C27B0';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('F1 Score', width / 2, padding - 10);
    ctx.font = '18px Arial';
    ctx.fillText((metrics.f1Score * 100).toFixed(1) + '%', width / 2, height - padding + 30);

    // Y-axis labels
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight * (1 - i / 10));
      ctx.fillText((i * 10).toString() + '%', padding - 10, y + 4);
    }
  };

  const drawRougeScores = () => {
    const canvas = rougeScoresRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = chartWidth / 4;
    const scores = [
      { name: 'ROUGE-1', value: rougeScores.rouge1, color: '#E91E63' },
      { name: 'ROUGE-2', value: rougeScores.rouge2, color: '#00BCD4' },
      { name: 'ROUGE-L', value: rougeScores.rougeL, color: '#FF5722' },
    ];

    scores.forEach((score, index) => {
      const barHeight = score.value * chartHeight;
      const barX = padding + (chartWidth / 4) + index * (barWidth + barWidth / 3);
      const barY = height - padding - barHeight;

      ctx.fillStyle = score.color;
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(score.name, barX + barWidth / 2, height - padding + 20);
      ctx.font = '14px Arial';
      ctx.fillText(score.value.toFixed(3), barX + barWidth / 2, barY - 10);
    });

    // Title
    ctx.font = 'bold 18px Arial';
    ctx.fillText('ROUGE Scores', width / 2, padding - 10);
  };

  const downloadChart = (canvasRef: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    drawConfusionMatrix();
    drawAccuracyChart();
    drawPrecisionRecall();
    drawF1Score();
    drawRougeScores();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Model Evaluation Metrics Report</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Confusion Matrix</h2>
        <canvas
          ref={confusionMatrixRef}
          width={600}
          height={600}
          style={{ border: '1px solid #000', display: 'block' }}
        />
        <button
          onClick={() => downloadChart(confusionMatrixRef, 'confusion_matrix.png')}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Download Confusion Matrix
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Accuracy</h2>
        <canvas
          ref={accuracyChartRef}
          width={600}
          height={400}
          style={{ border: '1px solid #000', display: 'block' }}
        />
        <button
          onClick={() => downloadChart(accuracyChartRef, 'accuracy.png')}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Download Accuracy Chart
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Precision & Recall</h2>
        <canvas
          ref={precisionRecallRef}
          width={600}
          height={400}
          style={{ border: '1px solid #000', display: 'block' }}
        />
        <button
          onClick={() => downloadChart(precisionRecallRef, 'precision_recall.png')}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Download Precision & Recall Chart
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>F1 Score</h2>
        <canvas
          ref={f1ScoreRef}
          width={600}
          height={400}
          style={{ border: '1px solid #000', display: 'block' }}
        />
        <button
          onClick={() => downloadChart(f1ScoreRef, 'f1_score.png')}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Download F1 Score Chart
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>ROUGE Scores</h2>
        <canvas
          ref={rougeScoresRef}
          width={600}
          height={400}
          style={{ border: '1px solid #000', display: 'block' }}
        />
        <button
          onClick={() => downloadChart(rougeScoresRef, 'rouge_scores.png')}
          style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Download ROUGE Scores Chart
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Metrics Summary</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Accuracy:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{(metrics.accuracy * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Precision:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{(metrics.precision * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Recall:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{(metrics.recall * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>F1 Score:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{(metrics.f1Score * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>ROUGE-1:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{rougeScores.rouge1.toFixed(3)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>ROUGE-2:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{rougeScores.rouge2.toFixed(3)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>ROUGE-L:</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{rougeScores.rougeL.toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

