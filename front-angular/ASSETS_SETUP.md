# Instruções para Configuração de Assets

## Imagens necessárias

Para que o projeto funcione corretamente, você precisa copiar as seguintes imagens da pasta `Front_end/images` para `front-angular/public/assets/images`:

### Imagens obrigatórias:
- `Logo_escola.png` - Logo da escola
- `logo.png` - Logo do header
- `Frente_escola.png` - Foto da fachada da escola
- `right-arrow.png` - Ícone de seta
- `hero-bg.png` - Background do hero
- `body-bg.jpg` - Background do body
- `shape-2.png` - Shape decorativo da seção de contato
- `search-icon.png` - Ícone de busca
- `search-icon-mobile.png` - Ícone de busca mobile
- `menu.png` - Ícone do menu mobile

## Como copiar:

Execute o seguinte comando no terminal na raiz do projeto:

```bash
# Criar diretório de assets se não existir
mkdir -p front-angular/public/assets/images

# Copiar todas as imagens
cp Front_end/images/* front-angular/public/assets/images/
```

Ou você pode copiar manualmente os arquivos usando o Finder:
1. Abra a pasta `Front_end/images`
2. Selecione todas as imagens necessárias
3. Copie-as para `front-angular/public/assets/images`

## Estrutura final esperada:

```
front-angular/
  public/
    assets/
      images/
        Logo_escola.png
        logo.png
        Frente_escola.png
        right-arrow.png
        hero-bg.png
        body-bg.jpg
        shape-2.png
        search-icon.png
        search-icon-mobile.png
        menu.png
        ... (outras imagens)
```

## Verificação

Após copiar as imagens, inicie o servidor de desenvolvimento:

```bash
cd front-angular
npm start
```

E verifique se todas as imagens estão sendo carregadas corretamente no navegador.
