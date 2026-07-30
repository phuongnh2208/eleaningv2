import { contains } from 'class-validator';
import { QueryUserDt0 } from '../dto/query-users.dto';

export class UserQueryBuilder {
  constructor(private query: QueryUserDt0) {}
  builderWhere() {
    const where: any = {};
    if (this.query.role) where.role = this.query.role;
    if (this.query.status) where.status = this.query.status;
    if (this.query.search) where.email = { contains: this.query.search };
    return where;
  }
  builderOrderBy(): any {
    const allowedSortFields = [
      'id',
      'email',
      'role',
      'status',
      'createdAt',
      'updatedAt',
    ];
    const sortBy = this.query.sortBy;
    if (sortBy && allowedSortFields.includes(sortBy)) {
      return {
        [sortBy]: this.query.sortOrder === 'asc' ? 'asc' : 'desc',
      };
    }
    return {
      createdAt: 'asc',
    };
  }
  builderPagination() {
    let page = Number(this.query.page) || 1;
    let limit = Number(this.query.limit) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 1000) limit = 10;
    return {
      page,
      limit,
      skip: page * limit - limit,
      take: limit,
    };
  }
}
