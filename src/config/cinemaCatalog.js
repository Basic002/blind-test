const CINEMA_CATALOG = [
  {
    "cinema": "Star Wars",
    "id": "493883202",
    "title": "The Imperial March",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/7624f39355ea85382d12fa84cace10a0/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Star Wars",
    "id": "493812702",
    "title": "Main Title",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/eb2f6181ac3d675ecd5eabb21529af69/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Star Wars",
    "id": "493896712",
    "title": "Duel of the Fates",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/e43599da9e47c54ffb8f6b503e1be4a8/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Harry Potter",
    "id": "661779",
    "title": "Hedwig's Theme",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/1ffc104374f70b3b9333cddb8be6e180/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Pirates des Caraïbes",
    "id": "3117931",
    "title": "He's a Pirate",
    "artist": "Klaus Badelt",
    "cover": "https://cdn-images.dzcdn.net/images/cover/e7d27421737821968036178d32d4b77b/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Seigneur des Anneaux",
    "id": "14628816",
    "title": "Concerning Hobbits",
    "artist": "Howard Shore",
    "cover": "https://cdn-images.dzcdn.net/images/cover/c8e0799a199841a8181ca524373869bb/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Seigneur des Anneaux",
    "id": "14628827",
    "title": "The Bridge of Khazad Dum",
    "artist": "Howard Shore",
    "cover": "https://cdn-images.dzcdn.net/images/cover/c8e0799a199841a8181ca524373869bb/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Gladiator",
    "id": "2044097897",
    "title": "Now We Are Free",
    "artist": "Hans Zimmer & Lisa Gerrard",
    "cover": "https://cdn-images.dzcdn.net/images/cover/5e53a39f8c6a69a7127e141f1b50e0f0/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Inception",
    "id": "6524423",
    "title": "Time",
    "artist": "Hans Zimmer",
    "cover": "https://cdn-images.dzcdn.net/images/cover/937f53e1a199b4d3bd34deccc9f1fe1a/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Interstellar",
    "id": "1137370842",
    "title": "Cornfield Chase",
    "artist": "Hans Zimmer",
    "cover": "https://cdn-images.dzcdn.net/images/cover/4193cfd449576b01d33adeb54c2589ce/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Interstellar",
    "id": "1137370872",
    "title": "Stay",
    "artist": "Hans Zimmer",
    "cover": "https://cdn-images.dzcdn.net/images/cover/4193cfd449576b01d33adeb54c2589ce/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Titanic",
    "id": "14552280",
    "title": "My Heart Will Go On",
    "artist": "Céline Dion",
    "cover": "https://cdn-images.dzcdn.net/images/cover/177346106112348e15ec4f9add0c1ef4/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Jurassic Park",
    "id": "2296192",
    "title": "Theme from Jurassic Park",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/77506857ed567321d22145d0c05271fb/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Pulp Fiction",
    "id": "2915013771",
    "title": "Misirlou",
    "artist": "Dick Dale",
    "cover": "https://cdn-images.dzcdn.net/images/cover/0eda880421c3dc4a8fd886ddc5de4859/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Retour vers le Futur",
    "id": "3447420421",
    "title": "Back to the Future",
    "artist": "Alan Silvestri",
    "cover": "https://cdn-images.dzcdn.net/images/cover/a280811cb8cfba3c4a2aa0221c5f9be8/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "James Bond",
    "id": "75672738",
    "title": "James Bond Theme",
    "artist": "Monty Norman Orchestra",
    "cover": "https://cdn-images.dzcdn.net/images/cover/ed587cf7bc58405f5376399e6a5ccedc/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "James Bond",
    "id": "82715364",
    "title": "Skyfall",
    "artist": "Adele",
    "cover": "https://cdn-images.dzcdn.net/images/cover/81e6d7baa7f47b804704922412e7a014/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Bon, la Brute et le Truand",
    "id": "3089012",
    "title": "The Good, the Bad and the Ugly",
    "artist": "Ennio Morricone",
    "cover": "https://cdn-images.dzcdn.net/images/cover/de1b27f01ec86cd6afc65c1591313c1e/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Parrain",
    "id": "3040776",
    "title": "The Godfather Waltz",
    "artist": "Nino Rota",
    "cover": "https://cdn-images.dzcdn.net/images/cover/da97bd562a9b372bd3985990f7c1c24d/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Rocky",
    "id": "99127208",
    "title": "Gonna Fly Now",
    "artist": "Bill Conti",
    "cover": "https://cdn-images.dzcdn.net/images/cover/a91857b1f8f6c4719f06613f2b08b1a1/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Rocky",
    "id": "576431",
    "title": "Eye of the Tiger",
    "artist": "Survivor",
    "cover": "https://cdn-images.dzcdn.net/images/cover/e66b5d3a40f69690c1633afb73cc590c/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Mission Impossible",
    "id": "876476",
    "title": "Theme from Mission: Impossible",
    "artist": "Lalo Schifrin",
    "cover": "https://cdn-images.dzcdn.net/images/cover/f69cfd668d9df27c2fdadf720a2b1a6a/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Indiana Jones",
    "id": "1033944",
    "title": "The Raiders March",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/6ad4f32049d89575b474ba1cab200e65/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Forrest Gump",
    "id": "24104861",
    "title": "Feather Theme",
    "artist": "Alan Silvestri",
    "cover": "https://cdn-images.dzcdn.net/images/cover/9b2cf09c89f4078c488901af1383031e/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "SOS Fantômes (Ghostbusters)",
    "id": "969252",
    "title": "Ghostbusters",
    "artist": "Ray Parker Jr.",
    "cover": "https://cdn-images.dzcdn.net/images/cover/4201e26250029b62d4dfa76ad503a01b/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Top Gun",
    "id": "7675051",
    "title": "Danger Zone",
    "artist": "Kenny Loggins",
    "cover": "https://cdn-images.dzcdn.net/images/cover/021a1143e9f19493379b8cf01fa1c7c5/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Top Gun",
    "id": "131085564",
    "title": "Top Gun Anthem",
    "artist": "Harold Faltermeyer",
    "cover": "https://cdn-images.dzcdn.net/images/cover/8190b6709a6ceea5521ef1088440aea5/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Fabuleux Destin d'Amélie Poulain",
    "id": "1412033722",
    "title": "La Valse d'Amélie",
    "artist": "Yann Tiersen",
    "cover": "https://cdn-images.dzcdn.net/images/cover/2fd533a88df88d36f213759a51d13afb/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Fabuleux Destin d'Amélie Poulain",
    "id": "1412033732",
    "title": "Comptine d'un autre été, l'après-midi",
    "artist": "Yann Tiersen",
    "cover": "https://cdn-images.dzcdn.net/images/cover/2fd533a88df88d36f213759a51d13afb/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Intouchables",
    "id": "1386411742",
    "title": "Fly",
    "artist": "Ludovico Einaudi",
    "cover": "https://cdn-images.dzcdn.net/images/cover/5a87ba5a470682fc0add7dfae644122b/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Intouchables",
    "id": "23712571",
    "title": "Una Mattina",
    "artist": "Ludovico Einaudi",
    "cover": "https://cdn-images.dzcdn.net/images/cover/dc1454f47d39378102179d8470474e6c/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "La La Land",
    "id": "137727939",
    "title": "City of Stars",
    "artist": "Ryan Gosling & Emma Stone",
    "cover": "https://cdn-images.dzcdn.net/images/cover/6693e6ad39c44db8a408375aded07d5d/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "La La Land",
    "id": "137727937",
    "title": "Another Day of Sun",
    "artist": "La La Land Cast",
    "cover": "https://cdn-images.dzcdn.net/images/cover/6693e6ad39c44db8a408375aded07d5d/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "The Dark Knight (Batman)",
    "id": "904628",
    "title": "Why So Serious?",
    "artist": "Hans Zimmer",
    "cover": "https://cdn-images.dzcdn.net/images/cover/db24b10af9499e1e5098c2a2328f8ef2/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Avengers",
    "id": "17840804",
    "title": "The Avengers",
    "artist": "Alan Silvestri",
    "cover": "https://cdn-images.dzcdn.net/images/cover/c49b7714e3c4b75e7604c5a86524ec27/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Kill Bill",
    "id": "3093563",
    "title": "Battle Without Honor or Humanity",
    "artist": "Tomoyasu Hotei",
    "cover": "https://cdn-images.dzcdn.net/images/cover/af231e7591d1a1f9cffe9237845690dc/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Kill Bill",
    "id": "1110233612",
    "title": "Bang Bang (My Baby Shot Me Down)",
    "artist": "Nancy Sinatra",
    "cover": "https://cdn-images.dzcdn.net/images/cover/4efbfb8855b2fd1a68ea125a106d55f4/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Shrek",
    "id": "917717",
    "title": "All Star",
    "artist": "Smash Mouth",
    "cover": "https://cdn-images.dzcdn.net/images/cover/34a4542cb4e8a54639674ed6aab1bd65/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Shrek",
    "id": "1565012",
    "title": "Hallelujah",
    "artist": "Rufus Wainwright",
    "cover": "https://cdn-images.dzcdn.net/images/cover/39c26ce7acdec0c14e2b0ec78636c004/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Men in Black",
    "id": "626417",
    "title": "Men in Black",
    "artist": "Will Smith",
    "cover": "https://cdn-images.dzcdn.net/images/cover/e06e37cd6c0b10dde07ff71b4a95fc2a/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Dirty Dancing",
    "id": "4323033022",
    "title": "(I've Had) The Time of My Life",
    "artist": "Bill Medley & Jennifer Warnes",
    "cover": "https://cdn-images.dzcdn.net/images/cover/1e7d1711f350a8586667b0e90bb4ec99/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Grease",
    "id": "781563062",
    "title": "You're The One That I Want",
    "artist": "John Travolta & Olivia Newton-John",
    "cover": "https://cdn-images.dzcdn.net/images/cover/337355fa64d7bb7cb64dec282415488d/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Cinquième Élément",
    "id": "707345202",
    "title": "The Diva Dance",
    "artist": "Inva Mula",
    "cover": "https://cdn-images.dzcdn.net/images/cover/529b13cc9d06db4c27affc5b6dc1f0d9/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Blade Runner",
    "id": "691120",
    "title": "Tears in Rain",
    "artist": "Vangelis",
    "cover": "https://cdn-images.dzcdn.net/images/cover/6d15927709b4f91db05b80f7d7ddee96/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Les Dents de la Mer (Jaws)",
    "id": "3393078661",
    "title": "Main Title (Theme From Jaws)",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/afc8410a992f30f0260c20f777abfb06/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "E.T. l'extra-terrestre",
    "id": "1848117757",
    "title": "Flying Theme",
    "artist": "John Williams",
    "cover": "https://cdn-images.dzcdn.net/images/cover/03a56f21d08c6843eebfb70e64385d15/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Le Professionnel",
    "id": "1815387917",
    "title": "Chi Mai",
    "artist": "Ennio Morricone",
    "cover": "https://cdn-images.dzcdn.net/images/cover/0450ca0afe42c012f10b9d1ad9183c05/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Il était une fois dans l'Ouest",
    "id": "2285387",
    "title": "Once Upon a Time in the West",
    "artist": "Ennio Morricone",
    "cover": "https://cdn-images.dzcdn.net/images/cover/961ffab8a8385f892da293ca1e0bb9e9/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Mad Max: Fury Road",
    "id": "647841602",
    "title": "Brothers in Arms",
    "artist": "Tom Holkenborg (Junkie XL)",
    "cover": "https://cdn-images.dzcdn.net/images/cover/65bfad1a30f57c4b2137e426765633b8/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Drive",
    "id": "62496771",
    "title": "Nightcall",
    "artist": "Kavinsky",
    "cover": "https://cdn-images.dzcdn.net/images/cover/7f9ecda862091716e4e8f74a7e115f93/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Drive",
    "id": "5092738",
    "title": "A Real Hero",
    "artist": "College & Electric Youth",
    "cover": "https://cdn-images.dzcdn.net/images/cover/deec88c0277495167578a13227f412ed/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Spider-Man",
    "id": "15220573",
    "title": "Main Title",
    "artist": "Danny Elfman",
    "cover": "https://cdn-images.dzcdn.net/images/cover/d3dd55c647a86ea741e8123ca1cbd81b/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Spider-Man: New Generation",
    "id": "602456552",
    "title": "Sunflower",
    "artist": "Post Malone & Swae Lee",
    "cover": "https://cdn-images.dzcdn.net/images/cover/1aa3dfe91b3e5d3bc71eca6b6e9c8d39/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Matrix",
    "id": "510698742",
    "title": "Spybreak!",
    "artist": "Propellerheads",
    "cover": "https://cdn-images.dzcdn.net/images/cover/f0331c06d2e23dbe57d66dc6ee6dec3c/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Matrix",
    "id": "2946066991",
    "title": "Clubbed to Death",
    "artist": "Rob Dougan",
    "cover": "https://cdn-images.dzcdn.net/images/cover/fbdc8a41437a644e6a10fd7846fae1c6/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Braveheart",
    "id": "65442214",
    "title": "For the Love of a Princess",
    "artist": "James Horner",
    "cover": "https://cdn-images.dzcdn.net/images/cover/6280a5cbbe92bb1a027aa8d2362c18bf/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Schindler's List",
    "id": "6066638",
    "title": "Theme from Schindler's List",
    "artist": "John Williams & Itzhak Perlman",
    "cover": "https://cdn-images.dzcdn.net/images/cover/ed2414b07609770b01fa69221580ae37/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "The Truman Show",
    "id": "1166571922",
    "title": "Truman Sleeps",
    "artist": "Philip Glass",
    "cover": "https://cdn-images.dzcdn.net/images/cover/ff3238065d2bdf61d9d40b595d65740a/250x250-000000-80-0-0.jpg"
  },
  {
    "cinema": "Requiem for a Dream",
    "id": "5416678",
    "title": "Lux Aeterna",
    "artist": "Clint Mansell",
    "cover": "https://cdn-images.dzcdn.net/images/cover/d5aa666919111e78c5296fda614b3b7c/250x250-000000-80-0-0.jpg"
  }
];

module.exports = { CINEMA_CATALOG };
