<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;

class RotatedFpdi extends Fpdi
{
    protected $angle = 0;

    public function Rotate($angle, $x = -1, $y = -1): void
    {
        if ($x == -1) {
            $x = $this->x;
        }
        if ($y == -1) {
            $y = $this->y;
        }
        if ($this->angle != 0) {
            $this->_out('Q');
        }
        $this->angle = $angle;
        if ($angle != 0) {
            $angle *= M_PI / 180;
            $c = cos($angle);
            $s = sin($angle);
            $this->_out(sprintf(
                'q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm',
                $c, $s, -$s, $c,
                $x * $this->k, ($this->h - $y) * $this->k,
                -$x * $this->k, -($this->h - $y) * $this->k
            ));
        }
    }

    protected function _endpage(): void
    {
        if ($this->angle != 0) {
            $this->angle = 0;
            $this->_out('Q');
        }
        parent::_endpage();
    }
}

class PdfWatermarkService
{
    /**
     * Overlay a watermark on a PDF file.
     *
     * @param  string  $absolutePath  Full absolute path of the original PDF.
     * @param  string  $watermarkText  The text to display as a watermark (e.g., "user@example.com").
     * @return string Binary string of the watermarked PDF.
     */
    public function watermark(string $absolutePath, string $watermarkText): string
    {
        if (! file_exists($absolutePath)) {
            throw new \InvalidArgumentException("Source PDF file not found at: {$absolutePath}");
        }

        $previousMemoryLimit = ini_get('memory_limit');
        ini_set('memory_limit', '512M');

        $pdf = new RotatedFpdi;
        $tmpFile = tempnam(sys_get_temp_dir(), 'pdf_wm_');

        try {
            $pageCount = $pdf->setSourceFile($absolutePath);

            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);

                $orientation = $size['width'] > $size['height'] ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);

                // 1. Diagonal Watermark in Center
                $pdf->SetFont('Helvetica', 'B', 16);
                $pdf->SetTextColor(220, 220, 220); // Light gray watermark

                $text = 'LICENSED TO: '.strtoupper($watermarkText);

                // Draw diagonal text at center
                $centerX = $size['width'] / 2;
                $centerY = $size['height'] / 2;

                $pdf->Rotate(45, $centerX, $centerY);
                // Center the text roughly based on length (Helvetica bold width is ~0.6 of font size)
                $textWidth = strlen($text) * 3.5;
                $pdf->Text($centerX - $textWidth, $centerY, $text);
                $pdf->Rotate(0); // Reset rotation

                // 2. Subtle Footer Watermark
                $pdf->SetFont('Helvetica', 'I', 8);
                $pdf->SetTextColor(150, 150, 150);
                $footerText = "Licensed digital copy for {$watermarkText}. Unauthorized distribution is prohibited.";
                $pdf->Text(15, $size['height'] - 10, $footerText);

                // Periodically collect garbage on large multi-page PDFs to prevent memory bloat
                if ($pageNo % 10 === 0) {
                    gc_collect_cycles();
                    if (memory_get_usage(true) > 400 * 1024 * 1024) {
                        \Log::warning('PdfWatermarkService: High memory usage detected during watermarking.', [
                            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                        ]);
                    }
                }
            }

            // Output to temp file buffer to avoid string memory accumulation in FPDF
            $pdf->Output('F', $tmpFile);
            $content = file_get_contents($tmpFile);

            return $content;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to process PDF watermark: '.$e->getMessage());
        } finally {
            if ($tmpFile && file_exists($tmpFile)) {
                @unlink($tmpFile);
            }
            ini_set('memory_limit', $previousMemoryLimit);
            gc_collect_cycles();
        }
    }
}
