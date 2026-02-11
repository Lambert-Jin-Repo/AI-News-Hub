export const metadata = {
    title: "About — AI News Hub",
    description: "Learn more about AI News Hub, your daily source for AI industry news and tools.",
};

export default function AboutPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-[#0d1b1a] dark:text-white mb-8">
                About AI News Hub
            </h1>

            <div className="prose dark:prose-invert max-w-none">
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    AI News Hub is your daily briefing for Artificial Intelligence news, tools, and breakthroughs.
                    We aggregate the most important updates from across the industry to keep you informed without the noise.
                </p>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-[#0d1b1a] dark:text-white">What We Do</h2>
                <ul className="space-y-2 mb-8 text-gray-600 dark:text-gray-300">
                    <li><strong>Daily News Digest:</strong> Curated summaries of the day&apos;s top AI stories.</li>
                    <li><strong>Tools Directory:</strong> A comprehensive database of the latest AI tools and models.</li>
                    <li><strong>Audio Briefings:</strong> Listen to your daily update on the go.</li>
                </ul>

                <h2 className="text-2xl font-bold mt-10 mb-4 text-[#0d1b1a] dark:text-white">Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    The pace of AI development is accelerating. Our mission is to make it easy for developers, researchers,
                    and enthusiasts to stay up-to-date with minimal effort.
                </p>
            </div>
        </main>
    );
}
