import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-600">404 - Página Não Encontrada</h2>
                <p className="mb-6 text-gray-600">Não conseguimos encontrar o que você procura.</p>
                <Link
                    href="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Voltar para Login
                </Link>
            </div>
        </div>
    )
}
