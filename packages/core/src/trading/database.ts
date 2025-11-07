export interface DrizzleDatabase {
  select: <T = unknown>() => {
    from: <TTable>(table: TTable) => {
      where: (condition: unknown) => {
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
    }
  }
  update: <TTable>(table: TTable) => {
    set: (values: unknown) => {
      where: (condition: unknown) => {
        run: () => Promise<void>
      }
    }
  }
}

