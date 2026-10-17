export type CardOptions = {
  game: string;
  names?: string;
  result: string;
  message: string;
  detail?: string;
};

const safeFilename = (value: string): string => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'paperplay-result';

const fitText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
  if (context.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 3 && context.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
  return `${output}…`;
};

export const downloadResultCard = async (options: CardOptions): Promise<void> => {
  if (typeof document === 'undefined') throw new Error('Download is only available in a browser.');
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 760;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the result card.');

  context.fillStyle = '#fff8f0';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#b9d4e8';
  context.lineWidth = 2;
  for (let y = 90; y < canvas.height; y += 44) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke();
  }
  context.strokeStyle = '#e8a0a8';
  context.beginPath(); context.moveTo(108, 0); context.lineTo(108, canvas.height); context.stroke();
  context.fillStyle = '#f25575';
  context.font = '700 32px Arial, sans-serif';
  context.fillText('PAPERPLAY', 150, 64);
  context.fillStyle = '#716a70';
  context.font = '600 22px Arial, sans-serif';
  context.fillText(options.game, 150, 132);
  context.fillStyle = '#2b2030';
  context.font = '700 66px Arial, sans-serif';
  context.fillText(fitText(context, options.result, 900), 150, 240);
  context.fillStyle = '#2b2030';
  context.font = '700 34px Arial, sans-serif';
  if (options.names) context.fillText(fitText(context, options.names, 900), 150, 320);
  context.font = '26px Arial, sans-serif';
  context.fillStyle = '#716a70';
  context.fillText(fitText(context, options.message, 900), 150, 390);
  if (options.detail) {
    context.font = '22px Arial, sans-serif';
    context.fillText(fitText(context, options.detail, 900), 150, 460);
  }
  context.fillStyle = '#f25575';
  context.font = 'italic 28px Georgia, serif';
  context.fillText('Open a page. Write two names. Play like old times.', 150, 650);
  context.fillStyle = '#716a70';
  context.font = '18px Arial, sans-serif';
  context.fillText('Just for fun — not a scientific prediction.', 150, 700);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Your browser could not export this result card.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFilename(options.game)}-result.png`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
