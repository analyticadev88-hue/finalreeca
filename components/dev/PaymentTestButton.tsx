'use client';

import { useRef, useState } from 'react';
import { Loader2, FlaskConical } from 'lucide-react';

// DEV-ONLY Cybersource payment tester.
// ⚠️ DEV BRANCH ONLY — must NOT be merged to main/production.
const SCENARIOS = [
  { label: 'ACCEPT (1000.00)', amount: '1000.00', hint: 'Expect ACCEPT / 100' },
  { label: 'System failure (4006.00)', amount: '4006.00', hint: 'Expect ERROR/DECLINE 150/233' },
  { label: 'Lost/stolen (4004.00)', amount: '4004.00', hint: 'Expect REJECT 205' },
  { label: 'Inactive card (4012.00)', amount: '4012.00', hint: 'Expect REJECT 208' },
  { label: 'Invalid card (4014.00)', amount: '4014.00', hint: 'Expect REJECT 231' },
  { label: 'Insufficient funds (4051.00)', amount: '4051.00', hint: 'Expect REJECT 204' },
  { label: 'Fraud (999.00)', amount: '999.00', hint: 'Expect REJECT 481 (Decision Manager)' },
  { label: '3DS success (100.00)', amount: '100.00', hint: 'Use 4456 5300 0000 1005' },
  { label: '3DS fail (100.00)', amount: '100.00', hint: 'Use 4456 5300 0000 1013' },
];

export default function PaymentTestButton() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('100.00');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const runTest = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/dev/test-capture-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setResult(`ERROR: ${data.error || 'failed to create capture context'}`);
        setBusy(false);
        return;
      }

      const captureContext = data.captureContext;
      const payload = JSON.parse(atob(captureContext.split('.')[1]));
      const clientLibraryUrl = payload.ctx[0].data.clientLibrary;

      await new Promise<void>((resolve, reject) => {
        const start = async () => {
          try {
            const w = window as any;
            const accept = await w.Accept(captureContext);
            const up = await accept.unifiedPayments();
            const tt = await up.show({
              containers: { paymentSelection: '#dev-test-buttons' },
            });
            const raw = await up.complete(tt);
            // complete() resolves with a JWT string — decode before reading status.
            const decode = (r: any) => {
              if (typeof r !== 'string') return r;
              const p = r.split('.');
              if (p.length !== 3) return r;
              try {
                const b = p[1].replace(/-/g, '+').replace(/_/g, '/');
                return JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
              } catch { return r; }
            };
            const completeResponse = decode(raw);
            console.log('DEV TEST complete response:', JSON.stringify(completeResponse));

            const status = String(completeResponse?.status || completeResponse?.outcome || completeResponse?.decision || '').toUpperCase();
            const details = completeResponse?.details || {};
            const reason =
              details?.errorInformation?.reason ||
              completeResponse?.message ||
              completeResponse?.reason ||
              completeResponse?.reasonCode ||
              status;
            const txnId = details?.processorInformation?.transactionId || '';
            const rc = details?.processorInformation?.responseCode || '';
            setResult(`COMPLETE — status: ${status || 'unknown'} | reason: ${reason}\ntxn: ${txnId} | responseCode: ${rc}\n(full JSON logged to console)`);
          } catch (err: any) {
            console.log('DEV TEST complete response:', JSON.stringify(err));
            setResult(`FAILED — ${err?.reason || ''} ${err?.message || String(err)}`);
          }
          resolve();
        };
        if (scriptLoadedRef.current || document.getElementById('cybersource-upe')) {
          scriptLoadedRef.current = true;
          start();
          return;
        }
        const script = document.createElement('script');
        script.id = 'cybersource-upe';
        script.src = clientLibraryUrl;
        script.async = true;
        script.onload = () => { scriptLoadedRef.current = true; start(); };
        script.onerror = () => { setResult('ERROR: failed to load Cybersource library'); resolve(); };
        document.body.appendChild(script);
      });
    } catch (err: any) {
      setResult(`ERROR: ${err?.message || String(err)}`);
    }
    setBusy(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-[9990] flex items-center gap-2 bg-black text-yellow-400 border-2 border-yellow-400 px-3 py-2 rounded-md text-xs font-mono font-bold shadow-lg hover:bg-gray-900"
      >
        <FlaskConical className="w-4 h-4" />
        DEVELOPER: payment test
      </button>

      {open && (
        <div className="fixed inset-0 z-[9997] bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Cybersource Test Harness</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800 text-lg">✕</button>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1">AMOUNT (BWP)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setAmount(s.amount)}
                  title={s.hint}
                  className="text-left border border-gray-200 rounded px-2 py-1.5 text-[11px] hover:border-yellow-400 hover:bg-yellow-50"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={runTest}
              disabled={busy}
              className="w-full bg-black text-yellow-400 font-bold py-2.5 rounded-md hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              RUN PAYMENT TEST
            </button>

            {/* Cybersource renders the card buttons here; the payment screen opens in the hosted sidebar */}
            <div id="dev-test-buttons" className="mt-3" />

            {result && (
              <pre className="mt-3 bg-gray-100 rounded p-3 text-xs whitespace-pre-wrap break-words text-gray-800">{result}</pre>
            )}
          </div>
        </div>
      )}
    </>
  );
}
