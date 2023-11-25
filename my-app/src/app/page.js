import Image from 'next/image'
import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="home-container">
            <h1>Welcome to Superhero Portal</h1>
            <div className="options-container">
                {/* <Link href="/createAcc"> */}
                    <a className="option-button">Create an Account</a>
                {/* </Link> */}
                {/* <Link href="/login"> */}
                    <a className="option-button">Login</a>
                {/* </Link> */}
            </div>
        </main>
    );
}
