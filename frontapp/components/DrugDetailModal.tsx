// components/DrugDetailModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { api, type DrugDetail } from "@/lib/api";
import { Modal, Stack } from "@mantine/core";

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
    <Modal
      opened={true}
      onClose={onClose}
      centered
      size="lg"
      radius="lg"
      title={<span style={{ fontWeight: 600, fontSize: 20 }}>{detail?.itemName ?? `상세 (${itemSeq})`}</span>}
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      {/* 에러 / 로딩 */}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!detail && !err && <p>불러오는 중…</p>}

      {/* 내용 */}
      {detail && !err && (
        <Stack gap="md">
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
        </Stack>
      )}
    </Modal>
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
