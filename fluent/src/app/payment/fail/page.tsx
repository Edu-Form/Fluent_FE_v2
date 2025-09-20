'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function FailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const message = searchParams.get('message');
        const code = searchParams.get('code');
        alert(`Payment failed: ${message} (code: ${code})`);
        router.push('/');
    }, [searchParams, router]);

    return <div><h2>결제 실패</h2><p>결제에 실패했습니다. 잠시 후 다시 시도해주세요.</p></div>;
}

export default function PaymentFailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FailContent />
        </Suspense>
    )
}
