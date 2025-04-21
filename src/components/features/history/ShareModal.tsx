import React, { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import * as clipboard from "clipboard-polyfill";

interface ShareModalProps {
  onClose: () => void;
  predictionData: {
    date: string;
    predictedDaysAgo: string;
    amount: string;
    pnlPercentage: number;
  };
}

export function ShareModal({
  onClose,
  predictionData
}: ShareModalProps) {
  const imageRef = useRef<HTMLDivElement>(null);

  const avgPnl = 12.2;
  const winRate = 87;

  // 모달 외부 클릭 시 닫히도록 설정
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyImage = async () => {
    if (!imageRef.current) return;

    try {
      // 로딩 표시 (실제 구현 시 로딩 컴포넌트로 대체 가능)
      const originalText = "Copy Image";
      const button = document.querySelector('button:contains("Copy Image")');
      if (button) button.textContent = "Copying...";

      // DOM 요소를 캔버스로 변환
      const canvas = await html2canvas(imageRef.current, {
        backgroundColor: null,
        scale: 2, // 고해상도 이미지를 위한 스케일 설정
        useCORS: true, // 외부 이미지 로드를 위한 CORS 설정
      });

      // 캔버스를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });

      // 클립보드에 이미지 복사
      await clipboard.write([
        new clipboard.ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      alert("Image copied to clipboard.");
    } catch (error) {
      console.error("Error copying image:", error);
      alert("Failed to copy image.");
    } finally {
      // 버튼 텍스트 복원 (실제 구현 시 상태로 관리)
      const button = document.querySelector('button:contains("Copying...")');
      if (button) button.textContent = "Copy Image";
    }
  };

  const handleShare = async () => {
    if (!imageRef.current) return;

    try {
      // DOM 요소를 캔버스로 변환
      const canvas = await html2canvas(imageRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      // 캔버스를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });

      // 파일 객체 생성
      const file = new File([blob], "prediction.png", { type: "image/png" });

      // Web Share API 지원 확인
      if (navigator.share) {
        await navigator.share({
          title: "My Prediction Result",
          text: `Prediction from ${predictionData.date}: ${predictionData.amount} (PnL ${predictionData.pnlPercentage.toFixed(2)}%)`,
          files: [file],
        });
      } else {
        // Web Share API를 지원하지 않는 경우 대체 방법
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "prediction.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("Image downloaded successfully.");
      }
    } catch (error) {
      alert("Failed to share.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center pb-6">
            <div className="w-4 h-4" />
            <h3 className="text-xl text-surface-on font-bold">
              Share your Prediction 👀
            </h3>

            <button onClick={onClose} className="text-black text-xl w-4">
              ✕
            </button>
          </div>

          {/* 이미지 영역 - ref 추가 */}
          <div
            ref={imageRef}
            className="w-full flex flex-col aspect-video rounded-lg bg-surface-container mb-4 relative overflow-hidden p-6"
          >
            <div className="flex justify-between text-[8px]">
              <div className="flex-1 flex gap-12">
                <div>
                  <p className="text-surface-on-var leading-[10px]">
                    Prediction Date
                  </p>
                  <p className="font-medium text-surface-on">
                    {predictionData.date}
                  </p>
                </div>
                <div>
                  <p className="text-surface-on-var leading-[10px]">
                    Predicted
                  </p>
                  <p className="font-medium text-surface-on">
                    {predictionData.predictedDaysAgo}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-primary font-bold text-[10px]">FunOption</p>
              </div>
            </div>

            <div className="mt-12 flex-1">
              <div className={`${predictionData.pnlPercentage > 0 ? 'text-positive' : 'text-negative'} text-4xl font-bold`}>
                {predictionData.pnlPercentage > 0 ? '+' : ''}{predictionData.amount}
              </div>
              <div className={`mt-2 inline-block ${predictionData.pnlPercentage > 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'} px-3 py-1 rounded-lg font-medium`}>
                PnL {predictionData.pnlPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="mt-6 flex text-[8px]">
              <div className="mr-6">
                <span className="mr-1 text-surface-on-var">avg PnL</span>
                <span className="font-medium text-surface-on">
                  {avgPnl}%
                </span>
              </div>
              <div>
                <span className="mr-1 text-surface-on-var">win rate</span>
                <span className="font-medium text-surface-on">
                  {winRate}%
                </span>
              </div>
            </div>

            <img
              src="/images/target.png"
              alt="target"
              className="h-[70%] absolute right-0 bottom-0"
            />
          </div>

          {/* 하단 버튼 영역 */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyImage}
              className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2 px-4 flex-1 text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Image
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 px-4 flex-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
