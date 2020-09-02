#RPG Game
currently just a test for tilesets and chunks

#gameData files
-tileData:
  image width (in tiles)
  image height (in tiles)
  tile size (in pixels)
  width * height numbers (to represent each tile's hitbox info)

-chunkMap (a chunk is a 32 * 32 array of tiles)
  map width (in chunks)
  map height (in chunks)
  width * height numbers (each refrence the index of a chunk from the ChunkMap class)

-chunks
  32 * 32 numbers (refrencing a tile from the tileset) for the bottom layer
  32 * 32 numbers (refrencing a tile from the tileset) for the top layer


