interface Config {
    http?: {
        port: number
    }
    sACN?: {
        universes: number[],
        iface?: string | null
    }
    dataDir: string
    assetsDir: string
    rebootInterval: number
}