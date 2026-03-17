import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async create(createHotelDto: CreateHotelDto, ownerId: number) {
    // Extract images and mainImageUrl (they're managed separately)
    const { images, mainImageUrl, ...dataWithoutImages } = createHotelDto as any;
    
    console.log('🏨 Creating hotel with:', { name: dataWithoutImages.name, ownerId });
    console.log('📷 Images to create:', { mainImageUrl, images });
    
    const hotel = await this.prisma.hotel.create({
      data: {
        ...dataWithoutImages,
        ownerId,
      },
      include: { images: true, ratings: true, bookings: true },
    });

    console.log('✅ Hotel created with ID:', hotel.id);

    // Create images if provided
    if (mainImageUrl || (images && images.length > 0)) {
      try {
        const imagesToCreate = [];
        
        // Add main image first
        if (mainImageUrl && mainImageUrl.trim()) {
          imagesToCreate.push({
            hotelId: hotel.id,
            imageUrl: mainImageUrl.trim(),
            displayOrder: 0,
          });
          console.log('📷 Adding main image:', mainImageUrl.trim());
        }
        
        // Add gallery images
        if (images && images.length > 0) {
          images.forEach((imageUrl: string, index: number) => {
            if (imageUrl && imageUrl.trim()) {
              imagesToCreate.push({
                hotelId: hotel.id,
                imageUrl: imageUrl.trim(),
                displayOrder: mainImageUrl ? index + 1 : index,
              });
              console.log(`📷 Adding gallery image ${index}:`, imageUrl.trim());
            }
          });
        }
        
        console.log(`📷 Total images to create: ${imagesToCreate.length}`);
        
        // Batch create all images
        for (const imageData of imagesToCreate) {
          const createdImage = await this.prisma.hotelImage.create({
            data: imageData,
          });
          console.log('✅ Image created with ID:', createdImage.id);
        }
      } catch (imageError) {
        console.error('❌ Error creating hotel images:', imageError);
        // Don't fail the entire hotel creation if images fail
        // The hotel is already created, just log the error
      }
    }

    // Return hotel with images
    const finalHotel = await this.prisma.hotel.findUnique({
      where: { id: hotel.id },
      include: { images: true, ratings: true, bookings: true },
    });
    
    console.log('✅ Final hotel with images:', { id: finalHotel?.id, imageCount: finalHotel?.images?.length });
    return finalHotel;
  }

  async findAll(skip = 0, take = 10, tourismPlaceId?: number) {
    // Ensure skip and take are valid numbers
    const validSkip = Math.max(0, Number(skip) || 0);
    const validTake = Math.max(1, Number(take) || 10);
    
    const where = tourismPlaceId ? { tourismPlaceId } : {};

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip: validSkip,
        take: validTake,
        include: { images: true, ratings: true },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return { hotels, total };
  }

  async findById(id: number) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        images: true,
        ratings: { include: { user: true } },
        bookings: true,
        tourismPlace: true,
      },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }

  async getByTourism(tourismPlaceId: number) {
    return this.prisma.hotel.findMany({
      where: { tourismPlaceId },
      include: { images: true, ratings: true },
    });
  }

  async checkUserRating(hotelId: number, userId: number) {
    const rating = await this.prisma.hotelRating.findFirst({
      where: { hotelId, userId },
    });
    return { hasRated: !!rating, rating };
  }

  async update(id: number, updateHotelDto: UpdateHotelDto) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Extract images and mainImageUrl (they're managed separately)
    const { images, mainImageUrl, ...dataWithoutImages } = updateHotelDto as any;

    console.log('🏨 [HotelsService.update] Updating hotel:', id);
    console.log('📋 [HotelsService.update] Full DTO received:', JSON.stringify(updateHotelDto, null, 2));
    console.log('📋 [HotelsService.update] Data to update:', dataWithoutImages);
    console.log('📷 [HotelsService.update] mainImageUrl:', mainImageUrl, 'Type:', typeof mainImageUrl);
    console.log('📷 [HotelsService.update] images:', images, 'Type:', typeof images, 'Length:', images?.length);
    console.log('📷 [HotelsService.update] Condition check - mainImageUrl truthy?', !!mainImageUrl, 'images truthy?', !!(images && images.length > 0));

    // Update hotel basic info
    const updatedHotel = await this.prisma.hotel.update({
      where: { id },
      data: dataWithoutImages,
      include: { images: true, ratings: true },
    });

    console.log('✅ [HotelsService.update] Hotel updated with ID:', updatedHotel.id);

    // Handle images if provided
    if (mainImageUrl || (images && images.length > 0)) {
      console.log('📷 [HotelsService.update] ENTERING IMAGE HANDLING BLOCK');
      try {
        // Delete existing images first
        const deleteResult = await this.prisma.hotelImage.deleteMany({
          where: { hotelId: id },
        });
        console.log('🗑️ [HotelsService.update] Deleted existing images for hotel:', id, 'Count:', deleteResult.count);

        const imagesToCreate = [];

        // Add main image first
        if (mainImageUrl && mainImageUrl.trim()) {
          imagesToCreate.push({
            hotelId: id,
            imageUrl: mainImageUrl.trim(),
            displayOrder: 0,
          });
          console.log('📷 [HotelsService.update] Adding main image:', mainImageUrl.trim());
        } else {
          console.log('📷 [HotelsService.update] Skipping main image - mainImageUrl is empty or whitespace');
        }

        // Add gallery images
        if (images && images.length > 0) {
          console.log('📷 [HotelsService.update] Processing', images.length, 'gallery images');
          images.forEach((imageUrl: string, index: number) => {
            console.log(`📷 [HotelsService.update] Gallery image ${index}:`, imageUrl, 'Type:', typeof imageUrl);
            if (imageUrl && imageUrl.trim()) {
              imagesToCreate.push({
                hotelId: id,
                imageUrl: imageUrl.trim(),
                displayOrder: mainImageUrl ? index + 1 : index,
              });
              console.log(`📷 [HotelsService.update] Added gallery image ${index}:`, imageUrl.trim());
            } else {
              console.log(`📷 [HotelsService.update] Skipped gallery image ${index} - empty or whitespace`);
            }
          });
        } else {
          console.log('📷 [HotelsService.update] No gallery images to process');
        }

        console.log(`📷 [HotelsService.update] Total images to create: ${imagesToCreate.length}`);

        // Batch create all images
        for (const imageData of imagesToCreate) {
          const createdImage = await this.prisma.hotelImage.create({
            data: imageData,
          });
          console.log('✅ [HotelsService.update] Image created with ID:', createdImage.id, 'URL:', createdImage.imageUrl);
        }
      } catch (imageError) {
        console.error('❌ [HotelsService.update] Error updating hotel images:', imageError);
        // Don't fail the entire update if images fail
        // The hotel is already updated, just log the error
      }
    } else {
      console.log('📷 [HotelsService.update] SKIPPING IMAGE HANDLING - both mainImageUrl and images are empty');
    }

    // Return hotel with updated images
    const finalHotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: { images: true, ratings: true },
    });

    console.log('✅ [HotelsService.update] Final hotel with images:', { id: finalHotel?.id, imageCount: finalHotel?.images?.length });
    return finalHotel;
  }

  async delete(id: number) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return this.prisma.hotel.delete({ where: { id } });
  }

  async getHotelsByOwner(ownerId: number, skip = 0, take = 10) {
    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { ownerId },
        skip,
        take,
        include: { images: true, ratings: true },
      }),
      this.prisma.hotel.count({ where: { ownerId } }),
    ]);

    return { hotels, total };
  }

  async addImage(hotelId: number, imageUrl: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return this.prisma.hotelImage.create({
      data: { hotelId, imageUrl },
    });
  }

  async removeImage(imageId: number) {
    return this.prisma.hotelImage.delete({ where: { id: imageId } });
  }

  async search(query: string, skip = 0, take = 10) {
    const where = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    const [hotels, total] = await Promise.all([
      this.prisma.hotel.findMany({
        where,
        skip,
        take,
        include: { images: true, ratings: true },
      }),
      this.prisma.hotel.count({ where }),
    ]);

    return { hotels, total };
  }

  async assignOwner(hotelId: number, userId: number) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: { ownerId: userId },
      include: { images: true, ratings: true },
    });
  }

  async removeOwner(hotelId: number) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return this.prisma.hotel.update({
      where: { id: hotelId },
      data: { ownerId: null },
      include: { images: true, ratings: true },
    });
  }
}
