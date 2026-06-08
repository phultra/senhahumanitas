import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
import { get, ref, update, onValue } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';
import { Consultorio } from '../../interface/consultorio';
import { Observable } from 'rxjs';

// Importar o Modal do Bootstrap
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//finalizado

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, FormsModule,],
  templateUrl: './operador.component.html',
  styleUrl: './operador.component.scss',
  providers:[BsModalRef, BsModalService]
})
export class OperadorComponent implements OnInit, OnDestroy {
  operador: string ='';
  guiche:any;
  setor: string ='';
  senhaOperadorPainel: DadosSenha = new DadosSenha;
  senhaPreferencial: DadosSenha []= [];
  senhaNormal: DadosSenha = new DadosSenha;
  senhaNormalNova: DadosSenha[] = [];
  senhaPainel: DadosSenha[] =[];
  repetirSenha: DadosSenha []= [];
  senhaFinalizar: DadosSenha = new DadosSenha;
  telaoperador:boolean = false;
  telalogin:boolean = true;
  mostrarSenhas: boolean = false; // Controla a exibição das senhas não atendidas
  mostrarFormularioPaciente: boolean = false;
  dadosPaciente = {
    nome: '',
    medico: '',
    // consultorio: '',
    senhaid: ''
  };
  medicos: any[] = []; // Lista de médicos
  // consultorios: any[] = []; // Lista de consultórios
  private keyPressHandler!: (event: KeyboardEvent) => void;
  private setorUsuarioDefinido = false;
  setorUsuario: string = '';
  

  private nomeUsuarioDefinido = false;
  nomeUsuario: string = '';
  nomeSelecionado: string = '';
  
  //propriedade para controle de avaliação
  exibirSelecaoNota: boolean = false;
  //notasDisponiveis: number[] = Array.from({ length: 11 }, (_, i) => i); // 0 a 10
  //notaSelecionada: number | null = null;
  
  notaFinalizada: number | null = null; 
  // Captura de nota via teclado
  notaDigitada: string | null = null;
 //SETORES


  // Array para armazenar as senhas geradas
  senhasDisponiveis: DadosSenha[] = [];

  //VARIÁVEL QUE CRIA FORMULARIO

   formulario!: FormGroup;

   senha: DadosSenha [] = [];
   senhaVerificar: DadosSenha[] =[];

   modalRef?: BsModalRef;
   
   @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private router: Router,
    private db: Database,
    private authService: AuthService,
    
  ) {}


  ngOnInit(): void {
    this.carregarMedicos();
    this.verificarNomeUsuario();
   console.log(sessionStorage.getItem('id'));
    // Verifica se o usuário está autenticado ao carregar o componente
    console.log(sessionStorage.getItem('guiche'))
 /* if (!sessionStorage.getItem('guiche')) {
    this.telaoperador = false
    this.formbuilder()
    this.carregarMedicos();
    return
  }  */
     console.log(this.telaoperador);

  if (sessionStorage.getItem('id') && !sessionStorage.getItem('guiche') ) {false
    this.telaoperador = false
    this.formbuilder()
 
  }else if (sessionStorage.getItem('id') && sessionStorage.getItem('guiche')) {
    
    this.telaoperador = true;
    this.guiche = sessionStorage.getItem('guiche');

  } else {
    this.telaoperador = false
    this.formbuilder()
    this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
    // this.carregarConsultorios();
 }
  
    // this.verificarSetorUsuario();

  this.mostrarSenhasNaoAtendidas();

   
    
     // Aqui unifica todas as senhas ccvom status "0"
  this.adminService.getSenhaGeradaConvencional().subscribe(d => {
    this.repetirSenha = d;
    this.senhaPainel = d;
    this.senhasDisponiveis = d.filter(s => s.status === '0');
  });

  // Painel
  /*this.adminService.getSenhaPainelConvencional().subscribe(d => {
    this.senhaPainel = d;
  });*/

  this.keyPressHandler = this.onKeyPress.bind(this);
}
 
  // Método para carregar os médicos do nó "medicos"
  carregarMedicos() {
    const medicosRef = ref(this.db, 'medicos');
    get(medicosRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          this.medicos = Object.values(snapshot.val());
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar médicos:', error);
      });
  }
 
  
  ngOnDestroy() {
    document.removeEventListener('keydown', this.keyPressHandler);
  }

 

    async verificarNomeUsuario() {
      // Criamos um identificador único para cada aba
      const abaId = this.gerarIdentificadorAba();
    
      // Verifica se já há um nome salvo para esta aba
      const nomeSalvo = localStorage.getItem(`nomeUsuario_${abaId}`);
      if (nomeSalvo) {
        this.nomeUsuario = nomeSalvo;
        
        this.nomeUsuarioDefinido = true;
        console.log(`Nome carregado para a aba ${abaId}:`, this.nomeUsuario);
        return;
      }
    
      // Se ainda não foi definido, busca do banco
      this.authService.getUser().subscribe(async user => {
        if (user && !this.nomeUsuarioDefinido) {
          const userRef = ref(this.db, `usuarios/${user.uid}`);
          const snapshot = await get(userRef);
    
          if (snapshot.exists()) {
            this.nomeUsuario = snapshot.val().nome.trim(); // Aqui estamos assumindo que o campo se chama 'nome'
            
            // Salva no localStorage com o ID da aba
            localStorage.setItem(`nomeUsuario_${abaId}`, this.nomeUsuario);
            this.nomeUsuarioDefinido = true;
            
            console.log(`Nome do usuário logado (Aba ${abaId}):`, this.nomeUsuario);
    
            // Se o nome selecionado for diferente, corrige
            if (this.nomeSelecionado.trim().toLowerCase() !== this.nomeUsuario.toLowerCase()) {
             // alert(`Nome: ${this.nomeUsuario}`);
              this.nomeSelecionado = this.nomeUsuario;
            }
    
            // Preenche o campo 'nome' do formulário
            this.formulario.get('nome')!.setValue(this.nomeUsuario);
          }
        }
      });
    }
    
     
    
 // Gera um identificador único para cada aba
private gerarIdentificadorAba(): string {
  // Sempre gera um novo ID quando a aba é recarregada
  const abaId = Math.random().toString(36).substring(2, 15); // Gera um ID aleatório
  sessionStorage.setItem('abaId', abaId); // Salva o novo ID no sessionStorage
  return abaId;
}

  // Criação do formulário de login do operador
  formbuilder(){
    this.formulario = this.formBuilder.group({
      setor: ['', Validators.required],
      guiche: ['',[Validators.required, Validators.minLength(5)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

  irparaverificasenha(){
      this.adminService.setDadosLogado(this.nomeUsuario);
      this.router.navigate(['/verificasenha'])
  }
  
  
   // Repete a chamada de uma senha no painel
  async repetirsenha(senha: DadosSenha) {
    
    this.spinner.show();
    try {
     
      const time = Date.now().toString();
      const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
      await update(ref(this.db, senhachamadaPath), {
        status: '1',
        horachamada: time
      });
      console.log('Chamada repetida:', senha);
    } catch (error) {
      console.error('Erro ao repetir chamada:', error);
    } finally {
      this.spinner.hide();
    }
}

 // Repete a chamada de uma senha convencional  
 async repetirSenhaConvencional(senha: DadosSenha) {
  this.spinner.show();
  console.log("Repetindo senha:", senha);

  // Remove a senha chamada anteriormente do painel
  this.senhaPainel = this.senhaPainel.filter(s => s.senhaid !== senha.senhaid);

  try {
   
  } catch (error) {
    console.error("Erro ao repetir senha:", error);
  } finally {
    this.spinner.hide();
  }
}

   // Chama uma senha normal no painel
  async chamarsenhanormal(senha:DadosSenha) {
    this.spinner.show();
    let time = Date.now().toString();
    console.log(senha);
    console.log(senha.operador);
    senha.status ='1';
    senha.horachamada = time;
    console.log(senha);
   // await this.adminService.salvaSenhaChamada(senha)
 //   await this.adminService.updateSenha(senha.senhaid, senha).then( d=> {
       this.spinner.hide();
      //  this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
  //  })
     // Registra o momento da chamada da senha
  this.senhaOperadorPainel = senha;  // Armazena a senha chamada
  }
  
  // Método para buscar as senhas do setor sem chamar automaticamente
 buscarSenhasDoSetor(): Promise<DadosSenha[]> {
  return new Promise((resolve, reject) => {
      this.adminService.getSenhasGeradas().subscribe(
          (senhas) => {
              console.log('Senhas recebidas para chamada:', senhas);
              if (!senhas || senhas.length === 0) {
                  console.warn('Nenhuma senha disponível para chamada.');
                  resolve([]);
                  return;
              }

              // Elimina duplicatas baseado no campo 'senha'
              const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
                  .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

             
          },
          (error) => {
              console.error('Erro ao buscar senhas para chamada:', error);
              reject(error);
          }
      );
  });
 }



// Método que só chama a senha quando o botão for clicado
chamarSenhaConvencional(senhaSelecionada?: DadosSenha) {
  // Verifica se há uma senha em andamento e se ela não foi finalizada
  if (this.senhaOperadorPainel && this.senhaOperadorPainel.status && this.senhaOperadorPainel.status !== '3') {
    alert('Finalize a senha atual antes de chamar uma nova!');
    return;
  }

  this.spinner.show();
  const time = Date.now().toString();

  const senha = senhaSelecionada || this.senhasDisponiveis.sort((a, b) => +a.horaGeracao - +b.horaGeracao)[0];

  if (!senha) {
    console.warn('Nenhuma senha disponível para chamada.');
    this.spinner.hide();
    return;
  }

  // Limpa os dados do paciente antes de chamar a próxima senha
  this.dadosPaciente = {
    nome: '',
    medico: '',
    // consultorio: '',
    senhaid: ''
  };

  senha.operador = this.operador;
  senha.guiche = this.guiche;
  senha.status = '1'; // Status "chamada"
  senha.horachamada = time;

  this.senhaOperadorPainel = senha;

  // Salvar a senha no nó `senhachamada`
  const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
  const senhageradaPath = `humanitas/senhagerada/${senha.senhaid}`;

  update(ref(this.db), {
    [senhachamadaPath]: {
      senhaid: senha.senhaid,
      senha: senha.senha,
      guiche: senha.guiche,
      operador: senha.operador,
      horachamada: senha.horachamada,
      status: senha.status,
      setor: senha.setor,
      preferencial: senha.preferencial || false,
      nome: senha.nome || '',
      consultorio: senha.consultorio || '',
      finalatendimento: '',
      horagerada: senha.horaGeracao,
      medico:''


    }
  })
    .then(() => {
      console.log(`Senha salva no nó senhachamada: ${senhachamadaPath}`);

      // Remover a senha do nó `senhagerada`
      update(ref(this.db), {
        [senhageradaPath]: null
      })
        .then(() => {
          console.log(`Senha removida do nó senhagerada: ${senhageradaPath}`);
        })
        .catch((error) => {
          console.error('Erro ao remover a senha do nó senhagerada:', error);
        });
    })
    .catch((error) => {
      console.error('Erro ao salvar a senha no nó senhachamada:', error);
    })
    .finally(() => {
      this.spinner.hide();
    });
}

salvarDadosPaciente() {
  const path = `humanitas/senhachamada/${this.dadosPaciente.senhaid}`;

  // Atualiza apenas os campos especificados, mantendo os outros dados inalterados
  update(ref(this.db, path), {
    nome: this.dadosPaciente.nome,
    medico: this.dadosPaciente.medico,
    // consultorio: this.dadosPaciente.consultorio
  })
    .then(() => {
      console.log('Dados do paciente atualizados com sucesso na coleção senhachamada!');
      this.mostrarFormularioPaciente = false;

      // Limpa o formulário
      this.dadosPaciente = {
        nome: '',
        medico: '',
        // consultorio: '',
        senhaid: ''
      };
    })
    .catch((error) => {
      console.error('Erro ao atualizar dados do paciente na coleção senhachamada:', error);
    });
}



// Carrega os setores do Firebase



  
  // Registra operador convencional no sistema
  cadastrarConvencional(){
    console.log(this.formulario.value);
    
     // Verifica se o setor foi selecionado
 
  if (!this.formulario.value.guiche) {
    alert('Por favor, selecione um guichê!');
    return; // Sai do método se o guiche não foi selecionado
  }
  if (!this.formulario.value.nome) {
    alert('Por favor, escreva seu nome!');
    return; // Sai do método se o nome não foi escrito
  } 
    
    
    if(this.formulario.value){
      this.operador = this.formulario.value.nome;
      //this.setorUsuario = this.formulario.value.setorUsuario; 
      // this.setor = this.formulario.value.setor; 
      this.guiche = this.formulario.value.guiche;
      sessionStorage.setItem('guiche', this.guiche);
      this.telaoperador = true;
      // this.filtrarSenhasPorSetor();
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    
      // Filtra as senhas do operador atual
  this.senhaVerificar = [];

    for (let index = 0; index < this.repetirSenha.length; index++) {
      
      if(this.repetirSenha[index].guiche === this.guiche) {
         this.senhaOperadorPainel = this.repetirSenha[index];
      }
      
    }
    
  
  
  }

  

  async finalizarConvencional1(senha: DadosSenha) {
      console.log(senha.setor);
      
      if (senha.setor === 'CONSULTA') {
            if (!this.dadosPaciente.nome || !this.dadosPaciente.medico ) {
              alert('Por favor, preencha todos os campos obrigatórios: Nome do Paciente, Nome do Médico e Número do Consultório.');
              return;
            }
              this.senhaOperadorPainel.senha = ''; 
              const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
              senha.nome = this.dadosPaciente.nome;
              senha.medico = this.dadosPaciente.medico;
            // senha.consultorio = this.dadosPaciente.consultorio;
              const time = Date.now().toString();
              //senha.finalatendimento = time;
              senha.status = '3'; // Status "finalizado"
              // Atualizar no nó `senhachamada`
              await update(ref(this.db, senhachamadaPath), {
                nome: senha.nome,
                medico: senha.medico,
                // consultorio: senha.consultorio,
                finalatendimento: time,
                status: senha.status
              }).then(dado => {
                 console.log("#######")
                 console.log(dado)
                 console.log("#######")
              })
           // console.log('Senha atualizada no nó senhachamada:', senha);
      } else if (senha.setor === 'REALIZAR AGENDAMENTO') {
            if(!this.dadosPaciente.nome ) {
              const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
              const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;
              const time = Date.now().toString();
              await update(ref(this.db), {
                  [senhafinalizadaPath]: {
                    ...senha,
                    finalatendimento: time
                  },
                  [senhachamadaPath]: null // Remove do nó `senhachamada`
                });

                this.senhaOperadorPainel.status = ''
                this.senhaOperadorPainel.senha = ''
                this.senhaOperadorPainel.setor = ''

            } else {
              this.senhaOperadorPainel.senha = '';
              const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
              senha.nome = this.dadosPaciente.nome;
              senha.medico = this.dadosPaciente.medico;
            // senha.consultorio = this.dadosPaciente.consultorio;
              const time = Date.now().toString();
             // senha.finalatendimento = time;
              senha.status = '3'; // Status "finalizado"
              // Atualizar no nó `senhachamada`
              await update(ref(this.db, senhachamadaPath), {
                nome: senha.nome,
                medico: senha.medico,
                // consultorio: senha.consultorio,
                finalatendimento: time,
                status: senha.status
              });
               this.senhaOperadorPainel.status = ''
               this.senhaOperadorPainel.senha = ''
               this.senhaOperadorPainel.setor = ''
            }
            //console.log('Senha atualizada no nó senhachamada:', senha);
      }else if (senha.setor === 'EXAME') {
            if(!this.dadosPaciente.nome) {
              const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
              const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;
              const time = Date.now().toString();
              await update(ref(this.db), {
                  [senhafinalizadaPath]: {
                    ...senha,
                    finalatendimento: time
                  },
                  [senhachamadaPath]: null // Remove do nó `senhachamada`
                });
                  this.senhaOperadorPainel.status = ''
                  this.senhaOperadorPainel.senha = ''
                   this.senhaOperadorPainel.setor = ''
            } else {
                
                const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
                senha.nome = this.dadosPaciente.nome;
                senha.medico = this.dadosPaciente.medico;
              // senha.consultorio = this.dadosPaciente.consultorio;
                const time = Date.now().toString();
               // senha.finalatendimento = time;
                senha.status = '3'; // Status "finalizado"
                // Atualizar no nó `senhachamada`
                await update(ref(this.db, senhachamadaPath), {
                  nome: senha.nome,
                  medico: senha.medico,
                  // consultorio: senha.consultorio,
                  finalatendimento: time,
                  status: senha.status
                });
                this.senhaOperadorPainel.senha = '';
                this.senhaOperadorPainel.status = ''
                this.senhaOperadorPainel.setor = ''
              }
            //  console.log('Senha atualizada no nó senhachamada:', senha);
      } else if (senha.setor === 'RESULTADO DE EXAMES'){
        this.senhaOperadorPainel.senha = '';
         this.senhaOperadorPainel.status = ''
          this.senhaOperadorPainel.setor = ''
         const time = Date.now().toString();
        
        const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
        const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;
        
        // Mover para o nó `senhafinalizada`
                await update(ref(this.db), {
                  [senhafinalizadaPath]: {
                    ...senha,
                    finalatendimento: time
                  },
                  [senhachamadaPath]: null // Remove do nó `senhachamada`
                });
              console.log('Senha movida para o nó senhafinalizada:', senha);
             
      } else if(senha.setor === 'AVALIAÇÃO DE MARCAPASSO') {
        
        if (!this.dadosPaciente.nome || !this.dadosPaciente.medico ) {
          alert('Por favor, preencha todos os campos obrigatórios: Nome do Paciente, Nome do Médico e Número do Consultório.');
          return;
        }
          this.senhaOperadorPainel.senha = ''; 
          const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
          senha.nome = this.dadosPaciente.nome;
          senha.medico = this.dadosPaciente.medico;
        // senha.consultorio = this.dadosPaciente.consultorio;
          const time = Date.now().toString();
          //senha.finalatendimento = time;
          senha.status = '3'; // Status "finalizado"
          // Atualizar no nó `senhachamada`
          await update(ref(this.db, senhachamadaPath), {
            nome: senha.nome,
            medico: senha.medico,
            // consultorio: senha.consultorio,
            finalatendimento: time,
            status: senha.status
          }).then(dado => {
             console.log("#######")
             console.log(dado)
             console.log("#######")
          })

      }


     /* try {
        const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
        const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;

        if (senha.setor === 'EXAME' || senha.setor === 'RESULTADO DE EXAMES') {
          // Mover para o nó `senhafinalizada`
          await update(ref(this.db), {
            [senhafinalizadaPath]: {
              ...senha,
              finalatendimento: senha.finalatendimento
            },
            [senhachamadaPath]: null // Remove do nó `senhachamada`
          });
          console.log('Senha movida para o nó senhafinalizada:', senha);
        } else {
          // Atualizar no nó `senhachamada`
          await update(ref(this.db, senhachamadaPath), {
            nome: senha.nome,
            medico: senha.medico,
            // consultorio: senha.consultorio,
            finalatendimento: senha.finalatendimento,
            status: senha.status
          });
          console.log('Senha atualizada no nó senhachamada:', senha);
        }

        alert('Atendimento finalizado com sucesso!');
      } catch (error) {
        console.error('Erro ao finalizar a senha:', error);
        alert('Erro ao finalizar a senha. Tente novamente.');
      }*/
  }

  async finalizarConvencional(senha: DadosSenha) {
       // 1. Validações Iniciais (antes de tentar salvar)
      if (senha.setor === 'CONSULTA') {
        if (!this.dadosPaciente.nome || !this.dadosPaciente.medico) {
          alert('Por favor, preencha todos os campos obrigatórios.');
          return;
        }
      }

      //Verifica a conexão com a internet
     this.verficaConexaoInternet();

    try {
      const time = Date.now().toString();
      const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
      const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;
  
      // --- LÓGICA DE ATUALIZAÇÃO ---
  
      if (senha.setor === 'CONSULTA') {
        await update(ref(this.db, senhachamadaPath), {
          nome: this.dadosPaciente.nome,
          medico: this.dadosPaciente.medico,
          finalatendimento: time,
          status: '3'
        });
      } 
      
      else if (senha.setor === 'REALIZAR AGENDAMENTO' || senha.setor === 'EXAME') {
        if (!this.dadosPaciente.nome) {
          // Se não tem nome, move para finalizada (deleta do nó atual)
          await update(ref(this.db), {
            [senhafinalizadaPath]: { ...senha, finalatendimento: time },
            [senhachamadaPath]: null
          });
        } else {
          // Se tem nome, apenas atualiza o status
          await update(ref(this.db, senhachamadaPath), {
            nome: this.dadosPaciente.nome,
            medico: this.dadosPaciente.medico,
            finalatendimento: time,
            status: '3'
          });
        }
      } 
      
      else if (senha.setor === 'RESULTADO DE EXAMES') {
        await update(ref(this.db), {
          [senhafinalizadaPath]: { ...senha, finalatendimento: time },
          [senhachamadaPath]: null
        });
      }

      else if(senha.setor === 'AVALIAÇÃO DE MARCAPASSO') {
        
        if (!this.dadosPaciente.nome || !this.dadosPaciente.medico ) {
          alert('Por favor, preencha todos os campos obrigatórios: Nome do Paciente, Nome do Médico e Número do Consultório.');
          return;
        }
          this.senhaOperadorPainel.senha = ''; 
          const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
          senha.nome = this.dadosPaciente.nome;
          senha.medico = this.dadosPaciente.medico;
        // senha.consultorio = this.dadosPaciente.consultorio;
          const time = Date.now().toString();
          //senha.finalatendimento = time;
          senha.status = '3'; // Status "finalizado"
          // Atualizar no nó `senhachamada`
          await update(ref(this.db, senhachamadaPath), {
            nome: senha.nome,
            medico: senha.medico,
            // consultorio: senha.consultorio,
            finalatendimento: time,
            status: senha.status
          }).then(dado => {
             console.log("#######")
             console.log(dado)
             console.log("#######")
          })

      }
  
      // --- SUCESSO ---
      // Se o código chegou aqui, significa que o Firebase confirmou a gravação.
      this.limparEstadoOperador();
      alert('Atendimento finalizado com sucesso!');
  
    } catch (error) {
      // --- ERRO (Falta de internet ou erro no servidor) ---
      console.error('Erro ao atualizar Firebase:', error);
      alert('Erro de conexão ou ao salvar dados. Verifique sua internet e tente novamente.');
    }
  }
  
  verficaConexaoInternet(){
    console.log("### ENTROU NA VERIFICAÇÂO DA NET")
    const connectedRef = ref(this.db, ".info/connected");
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("Conectado ao Firebase");
      } else {
        // Aqui você pode até desabilitar o botão de "Finalizar" na tela
        console.warn("Conexão com o banco perdida!");
        alert('Sua internet CAIU verifique sua Conexão e tente novamente salvar os dados');
        this.spinner.hide();
      }
    });
  }
  // Função auxiliar para evitar repetição
  limparEstadoOperador() {
    this.senhaOperadorPainel.senha = '';
    this.senhaOperadorPainel.status = '';
    this.senhaOperadorPainel.setor = '';
  }

  



 mostrarSenhasNaoAtendidas() {
  console.log("Função chamada!");

  // Resetando os dados antes de fazer a nova chamada
  this.senha = [];  // Resetar a lista de senhas
  this.mostrarSenhas = false;  // Resetar a flag de exibição das senhas

  // Repetir o processo de busca e filtragem como na primeira execução
  this.adminService.getSenhasGeradas().subscribe({ // <--- HERE'S THE CHANGE
    next: (senhas) => {
      console.log('Senhas recebidas:', senhas);
      if (!senhas || senhas.length === 0) {
        console.warn('Nenhuma senha encontrada.');
        return;
      }

      // Elimina duplicatas baseado no campo 'senha'
      const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
        .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

      // Your existing logic for filtering and processing senhasUnicas would go here.
      // Since your provided code had some commented-out filtering logic,
      // I'm assuming you'll re-enable or replace it as needed.
      // For now, I'll just assign the unique passwords to this.senha to avoid errors.
      this.senha = senhasUnicas;


      // Para cada senha, calcular a hora com base no 'senhaid' (timestamp)
      this.senha.forEach(s => {
        // Converter o 'senhaid' (timestamp) em milissegundos para uma data
        const dataGeracao = new Date(Number(s.senhaid));
        // Obter apenas a hora, minutos e segundos
        s.horaGeracao = dataGeracao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      });

      // Atualiza a flag para exibir as senhas
      this.mostrarSenhas = true;
    },
    error: (error) => {
      console.error('Erro ao buscar senhas:', error);
    },
    // complete is optional if you don't need to do anything when the observable completes
    // complete: () => {
    //   console.log('Senha fetching completed.');
    // }
  });
}
 mostrarSenhasNaoAtendidas2() {
  console.log("Função chamada!");

  // Definir o intervalo de 5 segundos para reiniciar a função
 // setInterval(() => {
    // Resetando os dados antes de fazer a nova chamada
    this.senha = [];  // Resetar a lista de senhas
    // this.senhasPreferenciais = [];  // Resetar a lista de senhas preferenciais
    // this.senhasNaoPreferenciais = [];  // Resetar a lista de senhas não preferenciais
    this.mostrarSenhas = false;  // Resetar a flag de exibição das senhas

    // Repetir o processo de busca e filtragem como na primeira execução
   this.adminService.getSenhasGeradas().subscribe(
      senhas => {
        console.log('Senhas recebidas:', senhas);
        if (!senhas || senhas.length === 0) {
          console.warn('Nenhuma senha encontrada.');
          return;
        }

        // Elimina duplicatas baseado no campo 'senha'
        const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
          .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

        // Normaliza os setores (converte para minúsculas e remove espaços extras)
        // const setorUsuarioNormalizado = this.setorUsuario.trim().toLowerCase();

        // Filtra as senhas de acordo com o setor (guiche)
        // const senhasDoSetor = senhasUnicas.filter(s => s.setor.trim().toLowerCase() === setorUsuarioNormalizado);
        // console.log('Senhas do setor:', senhasDoSetor);

        // Atribui a lista de senhas filtradas
        // this.senha = senhasDoSetor; // Lista de senhas do setor
        // this.senhasPreferenciais = senhasDoSetor.filter((s) => s.preferencial);
        // this.senhasNaoPreferenciais = senhasDoSetor.filter((s) => !s.preferencial);

        // Para cada senha, calcular a hora com base no 'senhaid' (timestamp)
        this.senha.forEach(s => {
          // Converter o 'senhaid' (timestamp) em milissegundos para uma data
          const dataGeracao = new Date(Number(s.senhaid));
           // Obter apenas a hora, minutos e segundos
           s.horaGeracao = dataGeracao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });

        // Atualiza a flag para exibir as senhas
        this.mostrarSenhas = true;
      },
      (error) => {
        console.error('Erro ao buscar senhas:', error);
      }
    );
  }
  //, 500); // 500 milissegundos = 0,5 segundo
//}

async naoCompareceu(senha: DadosSenha) {
  if (!senha) return;
  this.spinner.show();
  try {
    const senhachamadaPath = `humanitas/senhachamada/${senha.senhaid}`;
    const senhafinalizadaPath = `humanitas/senhafinalizada/${senha.senhaid}`;

    // Atualiza o nome e status
    senha.nome = 'NÃO COMPARECEU';
    senha.status = '3';
    

    // Move para senhafinalizada e remove de senhachamada
    await update(ref(this.db), {
      [senhafinalizadaPath]: { ...senha, nome: 'NÃO COMPARECEU'},
      [senhachamadaPath]: null
    });

    alert('Marcado como NÃO COMPARECEU!');
  } catch (error) {
    console.error('Erro ao marcar como não compareceu:', error);
    alert('Erro ao marcar como não compareceu.');
  } finally {
    this.spinner.hide();
  }
}



  // Função chamada quando o valor de ngModel muda (captura a tecla pressionada)
  onKeyPress(event: KeyboardEvent): void {
    const key = event.key;
  
    // Permite apenas números de 0 a 9
    if (key >= '0' && key <= '9') {
      this.notaDigitada = key; // Sobrescreve a nota com o número pressionado
    }
  
    // Exibe no console a nota que foi digitada até o momento
    console.log('Nota digitada:', this.notaDigitada);
    
  }
  hide() {
    document.removeEventListener('keydown', this.keyPressHandler);
  }

 // Método para finalizar a senha com nota
 async finalizarComNota(modal: BsModalRef) {
  const nota = Number(this.notaDigitada); // Converte a nota para um número
  
  // Validação para garantir que a nota está entre 0 e 10
  if (nota < 1 || nota > 10) {
    alert('Por favor, insira uma nota válida entre 1 e 10!');
    return;
  }

  this.senhaFinalizar.nota = nota; // Atribui a nota à senhaFinalizar
  const senhachamadaPath = `humanitas/senhachamada/${this.senhaFinalizar.horachamada}`;

  try {
    // Salva as informações no banco de dados
    await this.adminService.salvaSenhaFinalizadaConvencional(this.senhaFinalizar);

    // Remove a senha chamada do Firebase
    await update(ref(this.db), {
      [senhachamadaPath]: null,
    });

    console.log(`Senha com finalatendimento ${this.senhaFinalizar.senhaid} apagada com sucesso no caminho: ${senhachamadaPath}`);

    alert('Atendimento finalizado com sucesso!');
    
    // Esconde os botões após finalizar o atendimento
    this.mostrarSenhas = false;
    if (this.modalRef) {
      this.modalRef.hide(); // Fecha o modal de forma segura
     
    }
    
    document.removeEventListener('keydown', this.keyPressHandler);

    // Remove a senha finalizada das listas de senhas
    this.senha = this.senha.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);
    // this.senhasPreferenciais = this.senhasPreferenciais.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);
    // this.senhasNaoPreferenciais = this.senhasNaoPreferenciais.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);
    this.senhasDisponiveis = this.senhasDisponiveis.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);

  } catch (error) {
    console.error('Erro ao finalizar a senha:', error);
  }
}

 sair(){
  this.authService.logout();
  sessionStorage.setItem('id', '');
  sessionStorage.setItem('guiche', '');
 }

}


