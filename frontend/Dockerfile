FROM node:22-alpine

WORKDIR /workspace

# Installazione dipendenze
COPY package*.json ./
RUN npm install

# Copia del codice sorgente
COPY . .

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
