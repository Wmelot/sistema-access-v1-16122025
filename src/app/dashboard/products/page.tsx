import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Package, AlertTriangle } from "lucide-react"
import { ProductsDialog } from "@/components/settings/ProductsDialog"
import { getProducts, deleteProduct } from "./actions"
import { Badge } from "@/components/ui/badge"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { ProductHistoryDialog } from "./product-history-dialog"
import { ProductToggle } from "./product-toggle"

export default async function ProductsPage() {
    const products = await getProducts()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Produtos e Estoque</h1>
                    <p className="text-muted-foreground">Gerencie o inventário de venda.</p>
                </div>
                <ProductsDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {products?.filter(p => !p.is_unlimited && p.stock_quantity < 5).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listagem de Produtos</CardTitle>
                    <CardDescription>
                        Controle de estoque e preços.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Estoque</TableHead>
                                <TableHead>Preço Venda</TableHead>
                                <TableHead>Custo Padrão</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                        Nenhum produto cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products?.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            {product.is_unlimited ? (
                                                <span className="text-xl leading-none">∞</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {product.stock_quantity}
                                                    {product.stock_quantity < 5 && (
                                                        <span className="text-xs text-red-500 font-semibold">(Baixo)</span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.base_price)}
                                        </TableCell>
                                        <TableCell>
                                            {product.cost_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.cost_price) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {product.is_unlimited ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Sob Encomenda
                                                </Badge>
                                            ) : (
                                                <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"}>
                                                    {product.stock_quantity > 0 ? 'Em Estoque' : 'Esgotado'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <ProductHistoryDialog productId={product.id} productName={product.name} />
                                            <ProductToggle id={product.id} isActive={product.active} />
                                            <ProductsDialog product={product} />
                                            <DeleteWithPassword
                                                id={product.id}
                                                onDelete={deleteProduct}
                                                description={`Tem certeza que deseja remover o produto "${product.name}"?`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
