import Link from 'next/link';
export default function Cancel(){return <main className="section"><div className="container"><span className="eyebrow">Checkout cancelled</span><h1>No payment was taken.</h1><p className="lead">Return to the Teracom Store when you're ready.</p><Link className="btn btn-primary" href="/store">Back to Store</Link></div></main>}
