import { ImageResponse } from 'next/og';

export const alt = 'Landed — a 90-day career recovery plan for Canadians';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#f3f3f1',
          background:
            'radial-gradient(circle at 82% 18%, rgba(29, 158, 117, 0.28), transparent 34%), linear-gradient(135deg, #0b0c0d 0%, #15171a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 8,
          }}
        >
          <span
            style={{
              display: 'flex',
              width: 14,
              height: 14,
              borderRadius: 999,
              background: '#1d9e75',
            }}
          />
          LANDED
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              maxWidth: 900,
              fontSize: 76,
              lineHeight: 1.03,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            A clearer next move after the call.
          </div>
          <div
            style={{
              maxWidth: 820,
              fontSize: 30,
              lineHeight: 1.35,
              color: '#a9adb3',
            }}
          >
            A focused 90-day career recovery plan with Canadian context and
            weekly priorities.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: '#a9adb3',
          }}
        >
          <span>Built for layoffs, non-renewals, and career pivots.</span>
          <span style={{ color: '#1d9e75', fontWeight: 700 }}>
            getlanded.ca
          </span>
        </div>
      </div>
    ),
    size,
  );
}
