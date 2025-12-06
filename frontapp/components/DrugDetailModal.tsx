// components/DrugDetailModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { api, type DrugDetail } from "@/lib/api";

type Props = {
  itemSeq: string;
  onClose: () => void;
};

export function DrugDetailModal({ itemSeq, onClose }: Props) {
  const [detail, setDetail] = useState<DrugDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const data = await api.drugDetail(itemSeq);
        setDetail(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "상세 조회 중 오류가 발생했습니다.";
        setErr(message);
      }
    })();
  }, [itemSeq]);

  return (
    <div
      onClick={(e) => {
        // 바깥(회색 배경) 클릭 시 닫기
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          maxWidth: 760,
          width: "90%",
          maxHeight: "80vh",
          padding: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          overflowY: "auto",
          display: "grid",
          gap: 16,
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              color: "#000",
            }}
          >
            {detail?.itemName ?? `상세 (${itemSeq})`}
          </h1>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* 에러 / 로딩 */}
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {!detail && !err && <p>불러오는 중…</p>}

        {/* 내용 */}
        {detail && !err && (
          <>
            {/* 상단 메타 정보 + 이미지 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              {detail.itemImage ? (
                <img
                  src={detail.itemImage}
                  alt={detail.itemName}
                  style={{
                    maxWidth: 160,
                    maxHeight: 160,
                    objectFit: "contain",
                    border: "1px solid #eee",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    border: "1px dashed #ddd",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                />
              )}

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#222",
                }}
              >
                <div>
                  <b>품목코드:</b> {detail.itemSeq}
                </div>
                {detail.entpName && (
                  <div>
                    <b>업체명:</b> {detail.entpName}
                  </div>
                )}
                {detail.className && (
                  <div>
                    <b>분류:</b> {detail.className}
                  </div>
                )}
                {detail.chart && (
                  <div>
                    <b>제형:</b> {detail.chart}
                  </div>
                )}
                {detail.etcOtcName && (
                  <div>
                    <b>전문/일반:</b> {detail.etcOtcName}
                  </div>
                )}
                {detail.materialName && (
                  <div>
                    <b>주요성분:</b> {detail.materialName}
                  </div>
                )}
                {detail.openDe && (
                  <div>
                    <b>공개일자:</b> {detail.openDe}
                  </div>
                )}
                {detail.updateDe && (
                  <div>
                    <b>수정일자:</b> {detail.updateDe}
                  </div>
                )}
              </div>
            </div>

            {/* 텍스트 섹션들 */}
            {renderSection("효능·효과", detail.efcyQesitm)}
            {renderSection("복용방법", detail.useMethodQesitm)}
            {renderSection("경고", detail.atpnWarnQesitm)}
            {renderSection("주의사항", detail.atpnQesitm)}
            {renderSection("상호작용", detail.intrcQesitm)}
            {renderSection("부작용", detail.seQesitm)}
            {renderSection("보관방법", detail.depositMethodQesitm)}
          </>
        )}
      </div>
    </div>
  );
}

function renderSection(title: string, content?: string) {
  if (!content) return null;
  return (
    <section>
      <h3
        style={{
          margin: "8px 0 4px",
          fontSize: 15,
          fontWeight: 600,
          color: "#000",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          whiteSpace: "pre-wrap",
          border: "1px solid #eee",
          borderRadius: 6,
          padding: 8,
          fontSize: 13,
          backgroundColor: "#fafafa",
          color: "#222",
        }}
      >
        {content}
      </div>
    </section>
  );
}
