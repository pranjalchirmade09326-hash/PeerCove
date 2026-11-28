import { ImageResponse } from "next/og";

export const alt = "PeerCove — Stepped-Care Peer Mental Wellness & Guided Support";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#102F2A",
          color: "#F7FAF8",
        }}
      >
        {/* Top brand lockup matching icon.svg & apple-icon.tsx */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: "#E8F4EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 10.5c-1.6 5.7-5.8 9.9-11.5 11.5 5.7 1.6 9.9 5.8 11.5 11.5 1.6-5.7 5.8-9.9 11.5-11.5-5.7-1.6-9.9-5.8-11.5-11.5Z"
                fill="#236B54"
              />
              <circle cx="24" cy="23" r="3.2" fill="#F7FAF8" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#E8F4EE",
            }}
          >
            PeerCove
          </div>
        </div>

        {/* Center headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 960,
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            A calm harbor for stepped-care peer mental wellness.
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#CFE6DA",
            }}
          >
            AI Wellbeing Companion, guided chat &amp; LiveKit voice intake, trained
            Peer Listener rooms, AES-256-GCM journaling, and &lt;2ms Crisis Sentinel.
          </div>
        </div>

        {/* Footer badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {[
            "5-Role RBAC",
            "LiveKit Listening Rooms",
            "AES-256-GCM Privacy",
            "Tele-MANAS 14416 · 988",
          ].map((pill) => (
            <div
              key={pill}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                backgroundColor: "#236B54",
                color: "#E8F4EE",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
