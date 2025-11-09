export interface DrizzleDatabase {
  select: <T = unknown>(fields?: unknown) => {
    from: <TTable>(table: TTable) => {
      where: (condition: unknown) => Promise<T[]> & {
        orderBy: (order: unknown) => {
          limit: (count: number) => {
            all: () => Promise<T[]>
          }
        }
        all: () => Promise<T[]>
      }
      innerJoin: (joinTable: unknown, condition: unknown) => {
        where: (condition: unknown) => Promise<T[]>
      }
      all: () => Promise<T[]>
    }
  }
  update: <TTable>(table: TTable) => {
    set: (values: unknown) => {
      where: (condition: unknown) => Promise<void>
    }
  }
}

