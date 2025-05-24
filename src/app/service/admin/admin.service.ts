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
        operador: senha.operador,
        tipo: senha.preferencial ? 'Preferencial' : 'Normal'
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
      //nota: 0,
      cliente: senha.cliente,
      senha: senha.senha,
      //atendida: false, //ainda nao atendida
    }).then(async d => {
       //console.log(d);
       console.log('Senha salva com SUCESSO'+ d);
    })
     .catch(e =>{
       console.log(e);
    
    })
  }


  
  // Salva uma senha finalizada no Realtime Database sob o caminho 'avelar/senhafinalizada'
 // Função otimizada para salvar a senha finalizada
 async salvaSenhaFinalizadaConvencional(
  senha: DadosSenha,
  
): Promise<void> {
 // const time = Date.now().toString(); // Hora da finalização
 // senha.finalatendimento = time; // Atualiza o tempo de finalização

  // Prepara os dados atualizados da senha
  const updatedSenha = {
    ...senha, // Mantém todos os dados existentes da senha
    status: 'finalizada', // Atualiza o status para "finalizada"
    
  };

  // Obtém o dia atual
  const dia = new Date().getDate(); // Obtém o dia atual

  // Cria uma referência para salvar os dados no Firebase
  const itemsRef = ref(this.database, `humanitas/senhafinalizada/${senha.finalatendimento}`);

  try {
    // Salva os dados da senha no Firebase
    await set(itemsRef, updatedSenha);
    console.log('Senha finalizada salva com sucesso no Realtime Database');
  } catch (error) {
    console.error('Erro ao salvar a senha finalizada no Realtime Database:', error);
  }
}

// Função para recuperar a senha finalizada, caso necessário
async recuperaSenhaFinalizada(senha: DadosSenha): Promise<any> {
  const senhaRef = ref(this.database, `humanitas/senhafinalizada/${senha.finalatendimento}`);
  try {
    const snapshot = await get(senhaRef);
    if (snapshot.exists()) {
      return snapshot.val(); // Retorna os dados da senha finalizada
    } else {
      console.log('Nenhum dado encontrado para a senha finalizada.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao recuperar os dados da senha finalizada:', error);
    return null;
  }
}


  // Salva uma senha no Realtime Database sob o caminho 'avelar/senhacontador'
  async salvaSenhaContadorConvencional(senha:DadosSenha) {
    let time = Date.now().toString();
    const millisec = Number(Date.now());
    const dat = new Date(millisec);
    let dia = dat.getDate();
     senha.finalatendimento = time;
    const itemsRef = ref(this.database, `humanitas/senhacontador/${senha.finalatendimento}` );
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
     
    const itemsRef = ref(this.database, `humanitas/senhagerada/${senha.senhaid}` );
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
     
    const itemsRef = ref(this.database, `humanitas/senhachamada/${senha.horachamada}` );
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
    //nota: 0,
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
getSenhasGeradas(): Observable<DadosSenha[]> {
  const db = getDatabase(); // Obtenha a instância do banco de dados
  const auth = getAuth(); // Obtenha a instância de autenticação, caso seja necessário

  // Caminho dinâmico da coleção 'senhagerada'
  const senhasRef = ref(db, `/humanitas/senhagerada`);

  return new Observable(observer => {
    // Escuta os dados da coleção no Firebase em tempo real
    onValue(senhasRef, (snapshot) => {
      const senhas = snapshot.val();

      if (senhas) {
        // Converte o objeto de senhas em um array
        const listaSenhas: DadosSenha[] = Object.values(senhas).map((senha: any) => {
          return senha;
        });

        observer.next(listaSenhas); // Emite todas as senhas
      } else {
        console.log("Nenhuma senha encontrada.");
        observer.next([]); // Caso não encontre senhas, emite um array vazio
      }
    }, (error) => {
      observer.error(error); // Em caso de erro, emite um erro
    });
  });
}




  //Retorna um Observable com os dados da referência avelar/senhachamada no Realtime Database.
  getSenhaPainelConvencional(): Observable<any[]> {
    const dbRef = ref(this.database, `humanitas/senhachamada`);

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
     
    const dbRef = ref(this.database, `humanitas/senhacontador`);

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
    const dbRef = ref(this.database, `humanitas/senhagerada/`);
   
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
    const senhaRef = ref(this.database, `humanitas/senhagerada/${id}`);
    return update(senhaRef, data);
  }

  
  //Atualiza os dados de uma senha no Firestore dentro da coleção senhagerada.
  updateSenha(id: string, data: Partial<DadosSenha>): Promise<void> {
    const senhaDocRef = doc(this.firestore, `senhagerada/${id}`);
    return updateDoc(senhaDocRef, data);
  }

  
  //Atualiza os dados de uma chamada de senha no Realtime Database na referência avelar/senhachamada/{id}.
  updateSenhaChamadaConvencional(id: string, data: Partial<DadosSenha>): Promise<void> {
  
    const senhaRef = ref(this.database, `humanitas/senhachamada/${id}`);
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
    const senhaRef = ref(this.database, `humanitas/senhachamada/${id}`);
    
    // Executa a operação de remoção
    return remove(senhaRef);
  }

 
}
  
