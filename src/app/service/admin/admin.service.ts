import { Injectable, inject } from '@angular/core';

import { Firestore,  collection,  collectionData,  deleteDoc,  doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { DadosSenha } from '../../interface/dadossenha';
import { Observable } from 'rxjs';
import { Database, get, getDatabase, onValue, ref, remove, set, update } from '@angular/fire/database';
import { DadosContador } from '../../interface/dadoscontador';
import { HttpClient } from '@angular/common/http';
import { getFirestore, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
 
  //variável para acessar o FIRESTORE
  private firestore = inject(Firestore);
  private database = inject(Database);
  dadosSenha: DadosSenha = new DadosSenha;
  private apimpresao = 'http://localhost:3000/dados';

  constructor(
    private http: HttpClient,
    ) { 
      this.firestore = getFirestore(); // Inicializa o Firestore
    }


     // Envia os dados da senha para um servidor externo para impressão via HTTP POST
    imprimir(senha:DadosSenha){
     console.log(senha.cliente);
     console.log(senha.operador);
  
      const dados = {
        cliente: senha.cliente, 
        guiche: senha.guiche,
        senha: senha.senha,
        operador: senha.operador
      };
      
      return this.http.post(this.apimpresao, dados);
    }


   // Salva uma nova senha no Firestore em uma coleção chamada 'senhagerada'    
  async salvaSenhaEvento(senha: DadosSenha) {
   // let time = Date.now().toString();
    let salvaSenha = doc(this.firestore,'senhagerada'+'/'+ senha.senhaid);
    let preferencial = false

    await setDoc(salvaSenha, {
      senhaid: senha.senhaid,
      guiche: senha.guiche,
      setor: senha.setor,
      operador: senha.operador,
      preferencial: preferencial,
      controle: false,
      status: '0',
      horachamada: '',
      finalatendimento: '',
      nota: 0,
      cliente: senha.cliente,
      senha: senha.senha,
      atendida: false, //ainda nao atendida
    }).then(async d => {
       //console.log(d);
       console.log('Senha salva com SUCESSO'+ d);
    })
     .catch(e =>{
       console.log(e);
    
    })
  }


  
  // Salva uma senha finalizada no Realtime Database sob o caminho 'avelar/senhafinalizada'
  async salvaSenhaFinalizadaConvencional(senha: DadosSenha){
   
    let time = Date.now().toString();
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     senha.finalatendimento = time;
    const itemsRef = ref(this.database, `avelar/senhafinalizada/${dia}/${senha.finalatendimento}` );
   // const newItemRef = push(itemsRef);
    await set(itemsRef, senha).then( d => {
      //console.log(d);
      console.log('Senha salva com SUCESSO'+ d);
   })
    .catch(e =>{
      console.log(e);
   
   })
  }


  // Salva uma senha no Realtime Database sob o caminho 'avelar/senhacontador'
  async salvaSenhaContadorConvencional(senha:DadosSenha) {
    let time = Date.now().toString();
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     senha.finalatendimento = time;
    const itemsRef = ref(this.database, `avelar/senhacontador/${dia}/${senha.finalatendimento}` );
   // const newItemRef = push(itemsRef);
    await set(itemsRef, senha).then( d => {
      //console.log(d);
      console.log('Senha salva com SUCESSO'+ d);
   })
    .catch(e =>{
      console.log(e);
   
   })
  }

  // Salva uma senha convencional no Realtime Database sob o caminho 'avelar/senhagerada'
  async salvaSenhaConvencionalRealime(senha: DadosSenha){
   
    
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     
    const itemsRef = ref(this.database, `avelar/senhagerada/${dia}/${senha.senhaid}` );
   // const newItemRef = push(itemsRef);
    return set(itemsRef, senha).then(async d => {
      //console.log(d);
      console.log('Senha salva com SUCESSO'+ d);
   })
    .catch(e =>{
      console.log(e);
   
   })
  }


   // Salva uma senha chamada no Realtime Database sob o caminho 'avelar/senhachamada'
  async salvaSenhaConvencionalChamadaRealTime(senha: DadosSenha){
   
    
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     
    const itemsRef = ref(this.database, `avelar/senhachamada/${senha.horachamada}` );
   // const newItemRef = push(itemsRef);
    await set(itemsRef, senha).then(async d => {
      //console.log(d);
      return 'Senha salva com SUCESSO' + d;
      console.log('Senha salva com SUCESSO' + d);
   })
    .catch(e =>{
      console.log(e);
   
   })
  }


  // Salva uma senha em um caminho genérico no Realtime Database
 async salvaSenhaRealTime(senha: DadosSenha){
   
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     
    const itemsRef = ref(this.database, `algo/${senha.operador}/${dia}/${senha.senhaid}` );
   // const newItemRef = push(itemsRef);
    return set(itemsRef, senha).then(async d => {
      //console.log(d);
      console.log('Senha salva com SUCESSO'+ d);
   })
    .catch(e =>{
      console.log(e);
   
   })
  }


  // Salva os contadores de senhas (normal e preferencial) no Firestore
async salvaContador(normal:number, preferencial:number){
  let salvaSenhaChamada = doc(this.firestore,'senhacontador'+'/'+ '0000000000000');
  await setDoc(salvaSenhaChamada, {
    senhanormal: normal,
    senhapreferencial: preferencial
    
  }).then(async d => {
     //console.log(d);
     console.log('Senha salva com SUCESSO'+ d);
  })
   .catch(e =>{
     console.log(e);
  
  })
}
  

// Atualiza os contadores de senhas (normal e preferencial) no Firestore
 async salvaSenhaChamada(data:DadosSenha){
  let salvaSenhaChamada = doc(this.firestore,'senhapainel'+'/'+ data.horachamada);
  await setDoc(salvaSenhaChamada, {
    cliente: data.cliente,
    senhaid: data.senhaid,
    guiche: data.guiche,
    setor: data.setor,
    operador: data.operador,
    preferencial: data.preferencial,
    controle: false,
    status: '1',
    horachamada: data.horachamada,
    finalatendimento: '',
    nota: 0,
    senha: data.senha
  }).then(async d => {
     //console.log(d);
     console.log('Senha salva com SUCESSO'+ d);
  })
   .catch(e =>{
     console.log(e);
  
  })
 
  }


  //Registra uma senha finalizada no Firestore, na coleção senhafinalizada, utilizando finalatendimento como identificador.
async salvaSenhafinalizada(data:DadosSenha){
    let salvaSenhaChamada = doc(this.firestore,'senhafinalizada'+'/'+ data.finalatendimento);
    await setDoc(salvaSenhaChamada, {
            data
    }).then(async d => {
       //console.log(d);
       console.log('Senha salva com SUCESSO'+ d);
    })
     .catch(e =>{
       console.log(e);
    
    })
   
    }
   
  
  //Retorna um Observable que emite os dados da coleção senhacontador do Firestore.
  getContador(): Observable<DadosContador[]> {
    const senhasCollection = collection(this.firestore, 'senhacontador');
    return collectionData<DadosContador>(senhasCollection, { idField: 'id' }) as Observable<DadosContador[]>;
  }


 // Retorna um Observable que emite os dados da coleção senhagerada do Firestore
// Agora recebe um parâmetro opcional 'atendida' para filtrar as senhas atendidas ou não atendidas.
// Função para buscar senhas de acordo com o parâmetro atendida
getSenhasGeradas(atendida: boolean): Observable<DadosSenha[]> {
  const db = getDatabase();  // Obtenha a instância do banco de dados
  const auth = getAuth();  // Obtenha a instância de autenticação, caso seja necessário
  const senhasRef = ref(db, '/avelar/senhagerada/29');  // Caminho da coleção 'senhagerada'

  return new Observable(observer => {
    // Escuta os dados da coleção no Firebase em tempo real
    onValue(senhasRef, (snapshot) => {
      const senhas = snapshot.val();

      if (senhas) {
        // Converte o objeto de senhas em um array
        const listaSenhas: DadosSenha[] = Object.values(senhas).map((senha: any) => {
          // Adiciona lógica para ajustar a propriedade 'atendida'
          senha.atendida = (senha.horachamada !== '');  // Se 'horachamada' não estiver vazia, então a senha foi atendida
          return senha;
        });

        // Filtra as senhas com base no parâmetro 'atendida'
        const senhasFiltradas = listaSenhas.filter(senha => senha.atendida === atendida);

        observer.next(senhasFiltradas); // Emite as senhas filtradas
      } else {
        console.log("Nenhuma senha encontrada.");
        observer.next([]);  // Caso não encontre senhas, emite um array vazio
      }
    }, (error) => {
      observer.error(error);  // Em caso de erro, emite um erro
    });
  });
}



 /* const senhasCollection = collection(this.firestore, 'senhagerada'); // Referência para a coleção 'senhagerada'
  
  // Se o parâmetro 'atendida' for fornecido, filtramos a coleção com base nesse valor.
  const queryRef = atendida !== undefined 
    ? query(senhasCollection, where('atendida', '==', false)) 
    : senhasCollection;

  return collectionData(queryRef, { idField: 'id' }) as Observable<DadosSenha[]>; // Retorna os dados da coleção com o campo 'id' mapeado
*/




  //Retorna um Observable que emite os dados da coleção senhapainel do Firestore.
  getSenhaPainel(): Observable<DadosSenha[]> {
    const senhasCollection = collection(this.firestore, 'senhapainel');
    return collectionData<DadosSenha>(senhasCollection, { idField: 'id' }) as Observable<DadosSenha[]>;
  }


  //Retorna um Observable com os dados da referência avelar/senhachamada no Realtime Database.
  getSenhaPainelConvencional(): Observable<any[]> {
    const dbRef = ref(this.database, `avelar/senhachamada`);

    return new Observable(observer => {
      onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const itens: any[] = [];
          snapshot.forEach((childSnapshot) => {
            itens.push({ key: childSnapshot.key, ...childSnapshot.val() });
          });
          observer.next(itens);
        } else {
          observer.next([]);
        }
      }, (error) => {
        observer.error(error);
      });
    });
  }


  //Retorna um Observable que emite dados da referência avelar/senhacontador/{dia} no Realtime Database.
  getContadorSenhaConvencional(): Observable<any[]> {
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     
    const dbRef = ref(this.database, `avelar/senhacontador/${dia}`);

    return new Observable(observer => {
      onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const itens: any[] = [];
          snapshot.forEach((childSnapshot) => {
            itens.push({ key: childSnapshot.key, ...childSnapshot.val() });
          });
          observer.next(itens);
        } else {
          observer.next([]);
        }
      }, (error) => {
        observer.error(error);
      });
    });
  }


  //Retorna um Observable que emite os dados da referência avelar/senhagerada/{dia} no Realtime Database.
  getSenhaGeradaConvencional(): Observable<any[]> {
    const dat = new Date();
    let dia = dat.getDate();
     console.log(dia);
    const dbRef = ref(this.database, `avelar/senhagerada/${dia}`);
   
    return new Observable(observer => {
      onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const itens: any[] = [];
          snapshot.forEach((childSnapshot) => {
            itens.push({ key: childSnapshot.key, ...childSnapshot.val() });
          });
          observer.next(itens);
        } else {
          observer.next([]);
        }
      }, (error) => {
        observer.error(error);
      });
    });  
  }


  //Busca dados de senhas geradas para um operador específico no Realtime Database na referência algo/{operador}/{dia}.
  async getContadorSenha(operador:string): Promise<any[]> {
    const dat = new Date();
    let dia = dat.getDate();
     console.log(dia);
    const dbRef = ref(this.database, `algo/${operador}/${dia}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()){
      const itens: any[] = []
      snapshot.forEach((childSnapshot) => {
        itens.push({key: childSnapshot.key, ...childSnapshot.val()});
       });
       console.log(itens);
       return itens;
    }else {
      return []
    }
  }
 
 
  //Atualiza os dados de uma senha no Realtime Database na referência avelar/senhagerada/{dia}/{id}
  updateSenhaRealtimeConvencional(id: string, data: Partial<DadosSenha>): Promise<void> {
    const dat = new Date();
    let dia = dat.getDate();
    const senhaRef = ref(this.database, `avelar/senhagerada/${dia}/${id}`);
    return update(senhaRef, data);
  }

  
  //Atualiza os dados de uma senha no Firestore dentro da coleção senhagerada.
  updateSenha(id: string, data: Partial<DadosSenha>): Promise<void> {
    const senhaDocRef = doc(this.firestore, `senhagerada/${id}`);
    return updateDoc(senhaDocRef, data);
  }

  
  //Atualiza os dados de uma chamada de senha no Realtime Database na referência avelar/senhachamada/{id}.
  updateSenhaChamadaConvencional(id: string, data: Partial<DadosSenha>): Promise<void> {
  
    const senhaRef = ref(this.database, `avelar/senhachamada/${id}`);
    return update(senhaRef, data);
  }


  //Atualiza os dados de uma chamada de senha no Firestore dentro da coleção senhapainel.
  updateSenhaChamada(id: string, data: Partial<DadosSenha>): Promise<void> {
    const senhaDocRef = doc(this.firestore, `senhapainel/${id}`);
    return updateDoc(senhaDocRef, data);
  }


  //Remove uma senha das coleções senhagerada e senhapainel no Firestore e salva a senha finalizada na coleção senhafinalizada.
  deleteSenhaChamada(senhafinalizada: DadosSenha){
    this.salvaSenhafinalizada(senhafinalizada);
    const senhaDoc = doc(this.firestore, `senhagerada/${senhafinalizada.senhaid}`);
    const senhaDoc2 = doc(this.firestore, `senhapainel/${senhafinalizada.horachamada}`);
    deleteDoc(senhaDoc);
    return deleteDoc(senhaDoc2);
  }

  
  //Remove uma senha chamada no Realtime Database na referência avelar/senhachamada/{id}.
  deleteSenhaChamadaConvencional(id: string): Promise<void> {
    // Cria uma referência ao item que deseja excluir no Realtime Database
    const senhaRef = ref(this.database, `avelar/senhachamada/${id}`);
    
    // Executa a operação de remoção
    return remove(senhaRef);
  }

 
  //Remove uma senha das referências avelar/senhagerada e avelar/senhachamada no Realtime Database, e a salva como finalizada em avelar/senhafinalizada.
  async finalizarSenhaChamadaConvencional(senhaFinalizada: DadosSenha){
    const dat = new Date();
    let dia = dat.getDate();
    console.log(dia);
    this.salvaSenhaFinalizadaConvencional(senhaFinalizada);
    // Cria uma referência ao database para a operação de update em ambos os caminhos
    const updates: { [key: string]: any } = {};
    updates[`avelar/senhagerada/${dia}/${senhaFinalizada.senhaid}`] = null; // Remove a senha da árvore 'senhagerada'
    updates[`avelar/senhachamada/${senhaFinalizada.horachamada}`] = null; // Remove a senha da árvore 'senhachamada'

    // Executa a operação de update que removerá as duas entradas
    await update(ref(this.database), updates);

  }

    // Método para atualizar o status de uma senha
  async atualizarStatusSenha(senha: DadosSenha) {
    const senhaDocRef = doc(this.firestore, 'senhagerada', senha.senhaid); // Referência para o documento da senha
    await updateDoc(senhaDocRef, { status: senha.status }); // Atualiza o campo de status
  }

// Método para atualizar a senha para chamada
async atualizarSenhaParaChamada(senha: DadosSenha) {
  senha.atendida = true;  // Marca como atendida
  senha.status = '1';     // Status de chamada

  const senhaRef = doc(this.firestore, 'senhagerada', senha.senhaid);
  
  // Atualiza o campo atendida para 'true' na coleção 'senhagerada'
  await updateDoc(senhaRef, { atendida: true });

  // Agora mova para outra coleção, como 'senhaschamadas' ou outra coleção apropriada
  const novaColecaoRef = doc(this.firestore, 'senhaschamadas', senha.senhaid);
  await setDoc(novaColecaoRef, { ...senha });
  
  // Remova da coleção 'senhagerada'
  await deleteDoc(senhaRef);

  console.log('Senha atualizada e movida para chamada com sucesso!');
}
// Método para finalizar a senha
async finalizarSenha(senha: DadosSenha) {
  senha.atendida = true;  // Marca como atendida
  senha.status = '3';     // Status de finalizada

  const senhaRef = doc(this.firestore, 'senhaschamadas', senha.senhaid);

  // Atualiza o campo atendida para 'true' e finaliza a senha
  await updateDoc(senhaRef, { atendida: true, finalatendimento: Date.now().toString() });

  // Agora mova para outra coleção de finalizadas, por exemplo
  const novaColecaoRef = doc(this.firestore, 'senhasfinalizadas', senha.senhaid);
  await setDoc(novaColecaoRef, { ...senha });

  // Remova da coleção 'senhaschamadas'
  await deleteDoc(senhaRef);

  console.log('Senha finalizada e movida para a coleção finalizadas com sucesso!');
}

}
  
