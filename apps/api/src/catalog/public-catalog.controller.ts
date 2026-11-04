import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ArtistsService } from './artists.service';

@Controller('api/public')
export class PublicCatalogController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly artistsService: ArtistsService,
  ) {}

  @Get('services')
  async listServices() {
    return this.servicesService.listPublicServices();
  }

  @Get('artists')
  async listArtists() {
    return this.artistsService.listPublicArtists();
  }

  @Get('artists/:id')
  async getArtist(@Param('id') id: string) {
    return this.artistsService.getPublicArtistById(id);
  }
}
