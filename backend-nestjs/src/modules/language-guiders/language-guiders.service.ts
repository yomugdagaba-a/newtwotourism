import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LanguageGuidersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.languageGuider.create({ data });
  }

  async findAll(skip = 0, take = 10) {
    const [guiders, total] = await Promise.all([
      this.prisma.languageGuider.findMany({ skip, take }),
      this.prisma.languageGuider.count(),
    ]);
    return { guiders, total };
  }

  async findById(id: number) {
    const guider = await this.prisma.languageGuider.findUnique({ where: { id } });
    if (!guider) throw new NotFoundException('Language guider not found');
    return guider;
  }

  async update(id: number, data: any) {
    const guider = await this.prisma.languageGuider.findUnique({ where: { id } });
    if (!guider) throw new NotFoundException('Language guider not found');
    return this.prisma.languageGuider.update({ where: { id }, data });
  }

  async delete(id: number) {
    const guider = await this.prisma.languageGuider.findUnique({ where: { id } });
    if (!guider) throw new NotFoundException('Language guider not found');
    return this.prisma.languageGuider.delete({ where: { id } });
  }

  async findByLanguage(language: string) {
    return this.prisma.languageGuider.findMany({
      where: { languages: { has: language } },
    });
  }
}
