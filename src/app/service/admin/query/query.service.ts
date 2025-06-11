import { inject, Injectable } from '@angular/core';
import { getDatabase, ref, query, orderByChild, equalTo, onValue, off, Database } from '@angular/fire/database';
import { Observable } from 'rxjs';
// 2. Importe TUDO do 'firebase/database' SOB UM ALIAS (ex: RTDB)
import * as RTDB from 'firebase/database';
@Injectable({
  providedIn: 'root'
})
export class QueryService {
  //private database = inject(Database);
  private database: RTDB.Database = inject(Database); // <-- Injeção correta
  private senhasDoMedico: any[] = [];
  constructor() { }

  getSenhasParaMedico(medicoNome: string = 'Gabriel'): Observable<any[]> { // Pode passar o nome como parâmetro
    const senhasRef = RTDB.ref(this.database, 'humanitas/senhachamada');
  
    // ***** ESTA É A QUERY QUE FILTRA NO BANCO DE DADOS *****
    const medicoQuery = RTDB.query(
      senhasRef,
      RTDB.orderByChild('medico'),
      RTDB.equalTo(medicoNome) // Usa o nome do médico para filtrar
      // Opcional: Adicione outros filtros, como por status, se desejar
      // RTDB.orderByChild('status'), RTDB.equalTo('0') // Exemplo: apenas senhas com status '0'
    );
  
    return new Observable(observer => {
      const unsubscribe = RTDB.onValue(medicoQuery, (snapshot) => {
      //  const senhasDoMedico: any[] = [];
          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
             this.senhasDoMedico.push({ key: childSnapshot.key, ...childSnapshot.val() });
            });
          };
        observer.next(this.senhasDoMedico); // Emite o array JÁ FILTRADO
      }, (error) => {
        console.error("Erro na escuta de senhas:", error);
        observer.error(error);
      });
      return () => {
        RTDB.off(medicoQuery, 'value', unsubscribe);
      };
    });
  }

}



// Supondo que 'this.database' já está inicializado via getDatabase()
// Exemplo: this.database = getDatabase();

